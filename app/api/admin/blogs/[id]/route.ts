/**
 * Admin Blog Detail API
 * GET /api/admin/blogs/[id] - Get a single blog with full details
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdminEmail } from '@/lib/auth'
import { sql } from '@vercel/postgres'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !isAdminEmail(session.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const blogId = parseInt(id)

    if (isNaN(blogId)) {
      return NextResponse.json({ error: 'Invalid blog ID' }, { status: 400 })
    }

    const { rows } = await sql`
      SELECT
        b.*,
        s.title AS series_title,
        s.slug AS series_slug,
        COALESCE(s.index_blog_id = b.id, false) AS is_series_index
      FROM personal_website_blogs b
      LEFT JOIN personal_website_series s ON b.series_id = s.id
      WHERE b.id = ${blogId}
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    return NextResponse.json({ blog: rows[0] })
  } catch (error) {
    console.error('Error fetching blog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog' },
      { status: 500 }
    )
  }
}
