/**
 * Blog API Routes
 * POST /api/blogs - Create a new blog post
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { CreateBlogRequest } from '@/lib/types/blog'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateBlogRequest = await request.json()

    // Validate required fields
    if (!body.title || !body.slug || !body.content || !body.author_name) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, content, author_name' },
        { status: 400 }
      )
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
        seo_metadata,
        published_at
      ) VALUES (
        ${body.title},
        ${body.slug},
        ${body.content},
        ${body.excerpt || null},
        ${body.featured_image ? JSON.stringify(body.featured_image) : null}::jsonb,
        ${body.author_name},
        ${body.status || 'draft'},
        ${JSON.stringify(body.tags || [])}::jsonb::text[],
        ${JSON.stringify(body.categories || [])}::jsonb::text[],
        ${JSON.stringify(body.seo_metadata)}::jsonb,
        ${body.published_at ? new Date(body.published_at).toISOString() : null}
      )
      RETURNING id, title, slug, status
    `

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
