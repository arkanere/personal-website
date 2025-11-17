/**
 * Blog API Routes - Individual Blog
 * PATCH /api/blogs/[id] - Update an existing blog post
 * DELETE /api/blogs/[id] - Delete a blog post
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { UpdateBlogRequest } from '@/lib/types/blog'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const blogId = parseInt(id)

    if (isNaN(blogId)) {
      return NextResponse.json({ error: 'Invalid blog ID' }, { status: 400 })
    }

    const body: UpdateBlogRequest = await request.json()

    // Validate required fields
    if (!body.title || !body.slug || !body.content || !body.author_name) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, content, author_name' },
        { status: 400 }
      )
    }

    // Check if blog exists
    const { rows: existingBlog } = await sql`
      SELECT id FROM personal_website_blogs WHERE id = ${blogId}
    `

    if (existingBlog.length === 0) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    // Check if slug is taken by another blog
    const { rows: slugCheck } = await sql`
      SELECT id FROM personal_website_blogs WHERE slug = ${body.slug} AND id != ${blogId}
    `

    if (slugCheck.length > 0) {
      return NextResponse.json(
        { error: 'A blog with this slug already exists' },
        { status: 409 }
      )
    }

    // Update blog
    // Convert arrays to PostgreSQL array format: '{value1,value2}'
    const tags = body.tags || []
    const categories = body.categories || []
    const tagsArray = `{${tags.join(',')}}`
    const categoriesArray = `{${categories.join(',')}}`

    const { rows } = await sql`
      UPDATE personal_website_blogs SET
        title = ${body.title},
        slug = ${body.slug},
        content = ${body.content},
        excerpt = ${body.excerpt || null},
        featured_image = ${body.featured_image ? JSON.stringify(body.featured_image) : null}::jsonb,
        author_name = ${body.author_name},
        status = ${body.status},
        tags = ${tagsArray}::text[],
        categories = ${categoriesArray}::text[],
        seo_metadata = ${JSON.stringify(body.seo_metadata)}::jsonb,
        published_at = ${body.published_at ? new Date(body.published_at).toISOString() : null}
      WHERE id = ${blogId}
      RETURNING id, title, slug, status, updated_at
    `

    return NextResponse.json({
      success: true,
      blog: rows[0],
      message: 'Blog updated successfully',
    })

  } catch (error) {
    console.error('Error updating blog:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const blogId = parseInt(id)

    if (isNaN(blogId)) {
      return NextResponse.json({ error: 'Invalid blog ID' }, { status: 400 })
    }

    // Check if blog exists
    const { rows: existingBlog } = await sql`
      SELECT id, title FROM personal_website_blogs WHERE id = ${blogId}
    `

    if (existingBlog.length === 0) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    // Delete blog (hard delete)
    await sql`DELETE FROM personal_website_blogs WHERE id = ${blogId}`

    return NextResponse.json({
      success: true,
      message: `Blog "${existingBlog[0].title}" deleted successfully`,
    })

  } catch (error) {
    console.error('Error deleting blog:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
