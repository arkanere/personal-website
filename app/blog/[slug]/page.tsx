import { Header } from '@/components/Header'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { sql } from '@vercel/postgres'
import { Blog } from '@/lib/types/blog'
import type { Metadata } from 'next'

export const revalidate = 60

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
    title: post.seo_metadata.metaTitle || `${post.title} - Aniruddha Kanere`,
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
      <main className="container main">
        <Link href="/" className="back-link">
          ← Back
        </Link>

        <article>
          <header className="post-header">
            <h1 className="post-title">
              {post.title}
            </h1>
            <div className="post-meta">
              {post.published_at ? formatDate(post.published_at) : 'Draft'}
            </div>
          </header>

          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
    </>
  )
}
