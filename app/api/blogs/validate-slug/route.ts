/**
 * Slug Validation API Route
 * GET /api/blogs/validate-slug?slug=my-slug&excludeId=123
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')
    const excludeId = searchParams.get('excludeId')

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    // Validate slug format (lowercase, hyphens, alphanumeric)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json({
        available: false,
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
      })
    }

    // Check if slug exists in database
    let query
    if (excludeId) {
      const id = parseInt(excludeId)
      if (isNaN(id)) {
        return NextResponse.json(
          { error: 'Invalid excludeId parameter' },
          { status: 400 }
        )
      }
      query = await sql`
        SELECT id FROM personal_website_blogs WHERE slug = ${slug} AND id != ${id}
      `
    } else {
      query = await sql`
        SELECT id FROM personal_website_blogs WHERE slug = ${slug}
      `
    }

    const { rows } = query
    const isAvailable = rows.length === 0

    return NextResponse.json({
      available: isAvailable,
      message: isAvailable
        ? 'Slug is available'
        : 'This slug is already in use',
    })

  } catch (error) {
    console.error('Error validating slug:', error)
    return NextResponse.json(
      { error: 'Failed to validate slug' },
      { status: 500 }
    )
  }
}
