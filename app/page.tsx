import { Header } from '@/components/Header'
import Link from 'next/link'
import { sql } from '@vercel/postgres'

export const revalidate = 60

interface HomeListItem {
  id: number
  title: string
  slug: string
  excerpt: string | null
  published_at: Date | null
  series_title: string | null
  post_count: number
}

/**
 * The home page lists standalone articles alongside one article per series:
 * the index article the series designates. The rest of a series' articles are
 * reachable from that index rather than listed here.
 */
async function getHomePosts(): Promise<HomeListItem[]> {
  try {
    const { rows } = await sql`
      SELECT
        b.id, b.title, b.slug, b.excerpt, b.published_at,
        s.title AS series_title,
        COALESCE(
          (
            SELECT COUNT(*)
            FROM personal_website_blogs m
            WHERE m.series_id = s.id AND m.status = 'published'
          ),
          0
        ) AS post_count
      FROM personal_website_blogs b
      LEFT JOIN personal_website_series s ON b.series_id = s.id
      WHERE b.status = 'published'
        AND (b.series_id IS NULL OR s.index_blog_id = b.id)
      ORDER BY b.published_at DESC
    `
    return rows as HomeListItem[]
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return []
  }
}

export default async function Home() {
  const posts = await getHomePosts()

  return (
    <>
      <Header />
      <main className="container main">
        {posts.length === 0 ? (
          <p className="muted">No essays yet.</p>
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <div key={post.id}>
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
                {post.series_title && (
                  <span className="series-tag">
                    series · {post.post_count} {post.post_count === 1 ? 'part' : 'parts'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
