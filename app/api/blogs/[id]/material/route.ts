/**
 * Writing Material API
 * PATCH /api/blogs/[id]/material - Save the writing, and nothing else
 *
 * Separate from the update route so autosave can never touch the slug,
 * status, series or anything else the author has not finished deciding.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminEmail } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { toPgTextArray } from '@/lib/pg'
import { Twm } from '@/lib/types/blog'
import { canPublish, normalizeDraftKeywords, normalizeTwms, validateTwm } from '@/lib/lifecycle'

interface MaterialRequest {
  braindump?: string
  draft_keywords?: string[]
  twms?: Twm[]
  content?: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const blogId = parseInt(id)

    if (isNaN(blogId)) {
      return NextResponse.json({ error: 'Invalid blog ID' }, { status: 400 })
    }

    const body: MaterialRequest = await request.json()

    const { rows: existing } = await sql`
      SELECT b.id, b.status, COALESCE(s.index_blog_id = b.id, false) AS is_series_index
      FROM personal_website_blogs b
      LEFT JOIN personal_website_series s ON b.series_id = s.id
      WHERE b.id = ${blogId}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    const braindump = body.braindump || ''
    const draftKeywords = normalizeDraftKeywords(body.draft_keywords)
    const twms = normalizeTwms(body.twms)
    const content = body.content || ''

    for (const twm of twms) {
      const problem = validateTwm(twm.text)
      if (problem) return NextResponse.json({ error: problem }, { status: 422 })
    }

    // A background save must never empty an article that is live on the site.
    // The other material still saves; the final format is simply left alone
    // until the author saves deliberately.
    const live = existing[0].status === 'published'
    const keepContent =
      live && !canPublish(content, { isSeriesIndex: existing[0].is_series_index })

    const { rows } = await sql`
      UPDATE personal_website_blogs SET
        braindump = ${braindump},
        draft_keywords = ${toPgTextArray(draftKeywords)}::text[],
        twms = ${JSON.stringify(twms)}::jsonb,
        content = CASE WHEN ${keepContent} THEN content ELSE ${content} END
      WHERE id = ${blogId}
      RETURNING id, updated_at
    `

    return NextResponse.json({ success: true, blog: rows[0], contentKept: keepContent })

  } catch (error) {
    console.error('Error saving material:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
