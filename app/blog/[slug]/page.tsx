import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { sql } from '@vercel/postgres'
import { Blog } from '@/lib/types/blog'
import type { Metadata } from 'next'

export const revalidate = 60 // Revalidate every 60 seconds

async function getBlogBySlug(slug: string): Promise<Blog | null> {
  try {
    const { rows } = await sql`
      SELECT *
      FROM personal_website_blogs
      WHERE slug = ${slug} AND status = 'published'
    `
    return rows[0] as Blog || null
  } catch (error) {
    console.error('Error fetching blog:', error)
    return null
  }
}

async function incrementViewCount(slug: string) {
  try {
    await sql`
      UPDATE personal_website_blogs
      SET view_count = view_count + 1
      WHERE slug = ${slug}
    `
  } catch (error) {
    console.error('Error incrementing view count:', error)
  }
}

async function getAllPublishedSlugs() {
  try {
    const { rows } = await sql`
      SELECT slug
      FROM personal_website_blogs
      WHERE status = 'published'
    `
    return rows.map(row => row.slug)
  } catch (error) {
    console.error('Error fetching slugs:', error)
    return []
  }
}

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs()
  return slugs.map((slug) => ({
    slug: slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogBySlug(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: post.seo_metadata.metaTitle || `${post.title} - Your Name`,
    description: post.seo_metadata.metaDescription || post.excerpt || undefined,
    keywords: post.seo_metadata.keywords || undefined,
    openGraph: {
      title: post.seo_metadata.metaTitle || post.title,
      description: post.seo_metadata.metaDescription || post.excerpt || undefined,
      type: 'article',
      publishedTime: post.published_at?.toString(),
      authors: [post.author_name],
    },
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogBySlug(slug)

  if (!post) {
    notFound()
  }

  // Increment view count (fire and forget)
  incrementViewCount(slug)

  const formatDate = (dateString: string | Date) => {
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
            href="/blog"
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
              {post.published_at ? formatDate(post.published_at) : 'Draft'}
            </time>
            <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-4">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {post.excerpt}
              </p>
            )}
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              By {post.author_name}
            </div>
          </header>

          <div
            className="prose prose-gray dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
      <Footer />
    </>
  )
}
