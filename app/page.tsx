import { Header } from '@/components/Header'
import Link from 'next/link'
import { sql } from '@vercel/postgres'
import { BlogListItem } from '@/lib/types/blog'

export const revalidate = 60

async function getPublishedBlogs(): Promise<BlogListItem[]> {
  try {
    const { rows } = await sql`
      SELECT id, title, slug, excerpt, published_at
      FROM personal_website_blogs
      WHERE status = 'published'
      ORDER BY published_at DESC
    `
    return rows as BlogListItem[]
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return []
  }
}

export default async function Home() {
  const posts = await getPublishedBlogs()

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
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
