/**
 * Series API Routes - Individual Series
 * PATCH  /api/series/[id] - Update a series (title, slug, description, index article)
 * DELETE /api/series/[id] - Delete a series, detaching its articles
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminEmail } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { SeriesFormData } from '@/lib/types/blog'

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
    const seriesId = parseInt(id)

    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'Invalid series ID' }, { status: 400 })
    }

    const body: SeriesFormData = await request.json()

    if (!body.title?.trim() || !body.slug?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug' },
        { status: 400 }
      )
    }

    const title = body.title.trim()
    const slug = body.slug.trim()

    const { rows: existingSeries } = await sql`
      SELECT id FROM personal_website_series WHERE id = ${seriesId}
    `

    if (existingSeries.length === 0) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }

    const { rows: slugCheck } = await sql`
      SELECT id FROM personal_website_series WHERE slug = ${slug} AND id != ${seriesId}
    `

    if (slugCheck.length > 0) {
      return NextResponse.json(
        { error: 'A series with this slug already exists' },
        { status: 409 }
      )
    }

    // The index article has to be a member of this series, otherwise the home
    // page would list an article on behalf of a series it doesn't belong to.
    const indexBlogId = body.index_blog_id ?? null

    if (indexBlogId !== null) {
      const { rows: member } = await sql`
        SELECT id FROM personal_website_blogs
        WHERE id = ${indexBlogId} AND series_id = ${seriesId}
      `

      if (member.length === 0) {
        return NextResponse.json(
          { error: 'The index article must belong to this series' },
          { status: 400 }
        )
      }
    }

    const { rows } = await sql`
      UPDATE personal_website_series SET
        title = ${title},
        slug = ${slug},
        description = ${body.description?.trim() || null},
        index_blog_id = ${indexBlogId}
      WHERE id = ${seriesId}
      RETURNING id, title, slug, description, index_blog_id, created_at, updated_at
    `

    return NextResponse.json({
      success: true,
      series: rows[0],
      message: 'Series updated successfully',
    })

  } catch (error) {
    console.error('Error updating series:', error)
    return NextResponse.json(
      { error: 'Failed to update series' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const seriesId = parseInt(id)

    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'Invalid series ID' }, { status: 400 })
    }

    const { rows: existingSeries } = await sql`
      SELECT id, title FROM personal_website_series WHERE id = ${seriesId}
    `

    if (existingSeries.length === 0) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }

    // Detach the members first: deleting a series must never delete articles.
    // They become independent articles again and reappear on the home page.
    const { rowCount: detached } = await sql`
      UPDATE personal_website_blogs
      SET series_id = NULL, series_order = NULL
      WHERE series_id = ${seriesId}
    `

    await sql`DELETE FROM personal_website_series WHERE id = ${seriesId}`

    return NextResponse.json({
      success: true,
      detached_count: detached ?? 0,
      message: `Series "${existingSeries[0].title}" deleted. ${detached ?? 0} article(s) are now independent.`,
    })

  } catch (error) {
    console.error('Error deleting series:', error)
    return NextResponse.json(
      { error: 'Failed to delete series' },
      { status: 500 }
    )
  }
}
