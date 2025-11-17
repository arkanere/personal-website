import Link from 'next/link'
import { sql } from '@vercel/postgres'

export async function Blog() {
  // Fetch recent published blogs from database
  let recentPosts: any[] = []
  try {
    const { rows } = await sql`
      SELECT id, title, slug, excerpt, published_at
      FROM personal_website_blogs
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 3
    `
    recentPosts = rows
  } catch (error) {
    console.error('Error fetching blogs:', error)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <section id="blog" className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-4xl w-full">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">Blog</h2>

        {recentPosts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No blog posts yet. Check back soon!</p>
        ) : (
          <div className="space-y-8">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block border-b border-gray-200 dark:border-gray-800 pb-8 last:border-b-0 hover:opacity-75 transition-opacity"
              >
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500 mb-2">
                  <time>{formatDate(post.published_at)}</time>
                </div>
                <h3 className="text-2xl font-semibold mb-2">{post.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {post.excerpt}
                </p>
                <span className="inline-block mt-3 text-sm">
                  Read more →
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12">
          <Link
            href="/blog"
            className="text-lg hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            View all posts →
          </Link>
        </div>
      </div>
    </section>
  )
}
