/**
 * Series API Routes
 * GET  /api/series - List all series with their member articles
 * POST /api/series - Create a new series
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminEmail } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { SeriesFormData } from '@/lib/types/blog'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // One row per series, with its members rolled up in reading order.
    // Members with no explicit order sort last, then alphabetically by title.
    const { rows } = await sql`
      SELECT
        s.id, s.slug, s.title, s.description, s.index_blog_id,
        s.created_at, s.updated_at,
        COALESCE(
          (
            SELECT json_agg(p ORDER BY p.series_order NULLS LAST, p.title)
            FROM (
              SELECT b.id, b.title, b.slug, b.status, b.series_order
              FROM personal_website_blogs b
              WHERE b.series_id = s.id
            ) p
          ),
          '[]'::json
        ) AS posts
      FROM personal_website_series s
      ORDER BY s.title
    `

    return NextResponse.json({ series: rows })
  } catch (error) {
    console.error('Error fetching series:', error)
    return NextResponse.json(
      { error: 'Failed to fetch series' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const { rows: existing } = await sql`
      SELECT id FROM personal_website_series WHERE slug = ${slug}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A series with this slug already exists' },
        { status: 409 }
      )
    }

    const { rows } = await sql`
      INSERT INTO personal_website_series (title, slug, description)
      VALUES (${title}, ${slug}, ${body.description?.trim() || null})
      RETURNING id, title, slug, description, index_blog_id, created_at, updated_at
    `

    return NextResponse.json({
      success: true,
      series: rows[0],
      message: 'Series created successfully',
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating series:', error)
    return NextResponse.json(
      { error: 'Failed to create series' },
      { status: 500 }
    )
  }
}
