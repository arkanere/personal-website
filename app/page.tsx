import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="max-w-2xl mx-auto px-6 pb-20 flex-1 w-full">
          {posts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No essays yet.</p>
          ) : (
            <ul className="space-y-3 list-none p-0">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="no-underline hover:underline"
                    style={{ color: 'inherit' }}
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
        <Footer />
      </div>
    </>
  )
}
