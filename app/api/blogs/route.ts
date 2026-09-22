/**
 * Blog API Routes
 * POST /api/blogs - Create a new blog post
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminEmail } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { toPgTextArray } from '@/lib/pg'
import { CreateBlogRequest } from '@/lib/types/blog'
import { parseSeriesId, parseSeriesOrder, seriesExists, syncSeriesIndex } from '@/lib/series'
import { canPublish, normalizeDraftKeywords, normalizeTwms, validateTwm } from '@/lib/lifecycle'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateBlogRequest = await request.json()

    // An article captured as a brain dump has no content yet, so content is
    // only required once it reaches the final stage (enforced below).
    if (!body.title || !body.slug || !body.author_name) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, author_name' },
        { status: 400 }
      )
    }

    const content = body.content || ''
    const status = body.status || 'draft'
    const braindump = body.braindump || ''
    const draftKeywords = normalizeDraftKeywords(body.draft_keywords)
    const twms = normalizeTwms(body.twms)

    // You publish what is in the final format.
    const isSeriesIndex = Boolean(body.is_series_index)
    if (status === 'published' && !canPublish(content, { isSeriesIndex })) {
      return NextResponse.json(
        { error: 'The final format is empty, so there is nothing to publish' },
        { status: 422 }
      )
    }

    for (const twm of twms) {
      const problem = validateTwm(twm.text)
      if (problem) return NextResponse.json({ error: problem }, { status: 422 })
    }

    // Check if slug already exists
    const { rows: existingBlogs } = await sql`
      SELECT id FROM personal_website_blogs WHERE slug = ${body.slug}
    `

    if (existingBlogs.length > 0) {
      return NextResponse.json(
        { error: 'A blog with this slug already exists' },
        { status: 409 }
      )
    }

    // Insert new blog
    // Convert arrays to PostgreSQL array format: '{value1,value2}'
    const tags = body.tags || []
    const categories = body.categories || []
    const tagsArray = toPgTextArray(tags)
    const categoriesArray = toPgTextArray(categories)

    // A blog with no series_id is an ordinary standalone article.
    const seriesId = parseSeriesId(body.series_id)
    const seriesOrder = seriesId === null ? null : parseSeriesOrder(body.series_order)

    if (seriesId !== null && !(await seriesExists(seriesId))) {
      return NextResponse.json({ error: 'Series not found' }, { status: 400 })
    }

    const { rows } = await sql`
      INSERT INTO personal_website_blogs (
        title,
        slug,
        content,
        excerpt,
        featured_image,
        author_name,
        status,
        tags,
        categories,
        series_id,
        series_order,
        braindump,
        draft_keywords,
        twms,
        seo_metadata,
        published_at
      ) VALUES (
        ${body.title},
        ${body.slug},
        ${content},
        ${body.excerpt || null},
        ${body.featured_image ? JSON.stringify(body.featured_image) : null}::jsonb,
        ${body.author_name},
        ${status},
        ${tagsArray}::text[],
        ${categoriesArray}::text[],
        ${seriesId},
        ${seriesOrder},
        ${braindump},
        ${toPgTextArray(draftKeywords)}::text[],
        ${JSON.stringify(twms)}::jsonb,
        ${JSON.stringify(body.seo_metadata)}::jsonb,
        ${body.published_at ? new Date(body.published_at).toISOString() : null}
      )
      RETURNING id, title, slug, status
    `

    await syncSeriesIndex(rows[0].id, seriesId, Boolean(body.is_series_index))

    return NextResponse.json({
      success: true,
      blog: rows[0],
      message: 'Blog created successfully',
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating blog:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
