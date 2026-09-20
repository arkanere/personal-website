/** Series helpers shared by the blog create/update routes. */

import { sql } from '@vercel/postgres'

/** Normalize a series id coming off a request body into a number or null. */
export function parseSeriesId(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const id = typeof value === 'number' ? value : parseInt(String(value))
  return isNaN(id) ? null : id
}

/** Normalize a series order into a number or null (null = unordered, sorts last). */
export function parseSeriesOrder(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const order = typeof value === 'number' ? value : parseInt(String(value))
  return isNaN(order) ? null : order
}

export async function seriesExists(seriesId: number): Promise<boolean> {
  const { rows } = await sql`
    SELECT id FROM personal_website_series WHERE id = ${seriesId}
  `
  return rows.length > 0
}

/**
 * Keep series.index_blog_id consistent after a blog's series membership changes.
 *
 * A series points at exactly one index article, so this both claims the pointer
 * when a blog is marked as the index and releases it when the blog stops being
 * the index — including when the blog moves to another series or leaves one
 * entirely, which would otherwise leave a series indexed by a non-member.
 */
export async function syncSeriesIndex(
  blogId: number,
  seriesId: number | null,
  isSeriesIndex: boolean
): Promise<void> {
  // Release the pointer from every series this blog no longer indexes.
  if (seriesId === null) {
    await sql`
      UPDATE personal_website_series
      SET index_blog_id = NULL
      WHERE index_blog_id = ${blogId}
    `
    return
  }

  await sql`
    UPDATE personal_website_series
    SET index_blog_id = NULL
    WHERE index_blog_id = ${blogId} AND id <> ${seriesId}
  `

  if (isSeriesIndex) {
    await sql`
      UPDATE personal_website_series
      SET index_blog_id = ${blogId}
      WHERE id = ${seriesId}
    `
  } else {
    // Unchecking the box on the current index leaves the series without one.
    await sql`
      UPDATE personal_website_series
      SET index_blog_id = NULL
      WHERE id = ${seriesId} AND index_blog_id = ${blogId}
    `
  }
}
