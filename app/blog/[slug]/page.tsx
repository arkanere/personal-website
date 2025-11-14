import { getBlogPostById, blogPosts } from '@/lib/blog'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.id,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPostById(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: `${post.title} - Your Name`,
    description: post.excerpt,
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPostById(slug)

  if (!post) {
    notFound()
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
    <>
      <Header />
      <main className="min-h-screen pt-32 pb-20 px-6">
        <article className="max-w-3xl mx-auto">
          <Link
            href="/#blog"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-8"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to blog
          </Link>

          <header className="mb-8">
            <time className="text-sm text-gray-500 dark:text-gray-500">
              {formatDate(post.date)}
            </time>
            <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-4">
              {post.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {post.excerpt}
            </p>
          </header>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
              {post.content}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
