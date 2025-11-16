/**
 * Admin Blog List API
 * GET /api/admin/blogs - Get all blogs with full details
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rows } = await sql`
      SELECT
        id, title, slug, excerpt, author_name, status,
        published_at, created_at, updated_at, view_count
      FROM personal_website_blogs
      ORDER BY created_at DESC
    `

    return NextResponse.json({ blogs: rows })
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    )
  }
}
