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
      <main className="max-w-2xl mx-auto px-6 pb-20">
        {posts.length === 0 ? (
          <p className="text-gray-500">No essays yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:underline"
                >
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
