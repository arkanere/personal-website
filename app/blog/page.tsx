import { blogPosts } from '@/lib/blog'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Blog - Your Name',
  description: 'Articles and thoughts on web development',
}

export default function BlogPage() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-12">All Posts</h1>

          <div className="space-y-8">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="block border-b border-gray-200 dark:border-gray-800 pb-8 last:border-b-0 hover:opacity-75 transition-opacity"
              >
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500 mb-2">
                  <time>{formatDate(post.date)}</time>
                </div>
                <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {post.excerpt}
                </p>
                <span className="inline-block mt-3 text-sm">
                  Read more →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
