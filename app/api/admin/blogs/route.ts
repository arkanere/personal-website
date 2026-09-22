/**
 * Admin Blog List API
 * GET /api/admin/blogs - Get all blogs with full details
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminEmail } from '@/lib/auth'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rows } = await sql`
      SELECT
        b.id, b.title, b.slug, b.excerpt, b.author_name, b.status,
        b.published_at, b.created_at, b.updated_at, b.view_count,
        b.series_id, b.series_order, b.tags,
        s.title AS series_title,
        s.slug AS series_slug,
        COALESCE(s.index_blog_id = b.id, false) AS is_series_index
      FROM personal_website_blogs b
      LEFT JOIN personal_website_series s ON b.series_id = s.id
      ORDER BY b.created_at DESC
    `

    return NextResponse.json({ blogs: rows })
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pieces' },
      { status: 500 }
    )
  }
}
