'use client'

/**
 * Edit Blog Page
 * Form to edit an existing blog post
 */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import TipTapEditor from '@/components/TipTapEditor'
import SlugInput from '@/components/SlugInput'
import StatusBadge from '@/components/StatusBadge'
import { Blog, BlogStatus } from '@/lib/types/blog'
import Link from 'next/link'

export default function EditBlogPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const blogId = parseInt(params.id as string)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [blog, setBlog] = useState<Blog | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [status, setStatus] = useState<BlogStatus>('draft')
  const [tags, setTags] = useState('')
  const [categories, setCategories] = useState('')

  // SEO fields
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [seoExpanded, setSeoExpanded] = useState(false)

  // Fetch blog data
  useEffect(() => {
    fetchBlog()
  }, [blogId])

  const fetchBlog = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/blogs/${blogId}`)
      if (response.ok) {
        const data = await response.json()
        const blog: Blog = data.blog

        setBlog(blog)
        setTitle(blog.title)
        setSlug(blog.slug)
        setContent(blog.content)
        setExcerpt(blog.excerpt || '')
        setAuthorName(blog.author_name)
        setStatus(blog.status)
        setTags(blog.tags.join(', '))
        setCategories(blog.categories.join(', '))
        setSeoTitle(blog.seo_metadata.metaTitle)
        setSeoDescription(blog.seo_metadata.metaDescription)
        setSeoKeywords(blog.seo_metadata.keywords)
      } else {
        alert('Failed to load blog')
        router.push('/admin/blogs')
      }
    } catch (error) {
      console.error('Error fetching blog:', error)
      alert('An error occurred while loading the blog')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }
    if (!slug.trim()) {
      alert('Please enter a slug')
      return
    }
    if (!content.trim()) {
      alert('Please enter content')
      return
    }
    if (!authorName.trim()) {
      alert('Please enter an author name')
      return
    }

    setSaving(true)

    try {
      const blogData = {
        title: title.trim(),
        slug: slug.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || null,
        author_name: authorName.trim(),
        status: status,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        categories: categories.split(',').map(c => c.trim()).filter(c => c),
        seo_metadata: {
          metaTitle: seoTitle.trim() || title.trim(),
          metaDescription: seoDescription.trim(),
          keywords: seoKeywords.trim(),
        },
        published_at: status === 'published' && (!blog?.published_at)
          ? new Date().toISOString()
          : blog?.published_at,
      }

      const response = await fetch(`/api/blogs/${blogId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogData),
      })

      if (response.ok) {
        router.push('/admin/blogs')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update blog')
      }
    } catch (error) {
      console.error('Error updating blog:', error)
      alert('An error occurred while updating the blog')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${blog?.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/blogs/${blogId}`, { method: 'DELETE' })
      if (response.ok) {
        router.push('/admin/blogs')
      } else {
        alert('Failed to delete blog')
      }
    } catch (error) {
      console.error('Error deleting blog:', error)
      alert('An error occurred while deleting the blog')
    }
  }

  if (loading) {
    return (
      <div className="loading-center">
        <p>Loading blog...</p>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="loading-center">
        <p>Blog not found</p>
      </div>
    )
  }

  return (
    <div className="admin-content-wide">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="admin-page-title">Edit Blog</h1>

        {/* Info Banner */}
        <div className="info-banner">
          <div className="info-grid">
            <div>
              <span className="info-label">Status:</span>
              <div className="info-value">
                <StatusBadge status={blog.status} />
              </div>
            </div>
            {blog.published_at && (
              <div>
                <span className="info-label">Published:</span>
                <div className="info-value">
                  {new Date(blog.published_at).toLocaleDateString()}
                </div>
              </div>
            )}
            <div>
              <span className="info-label">Last Updated:</span>
              <div className="info-value">
                {new Date(blog.updated_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className="info-label">Views:</span>
              <div className="info-value">{blog.view_count}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-sidebar">
        {/* Main Content */}
        <div className="stack">
          {/* Title */}
          <div>
            <label className="form-label">
              Title <span className="form-required">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Enter blog title..."
              maxLength={255}
            />
            <p className="form-hint">{title.length}/255 characters</p>
          </div>

          {/* Slug */}
          <div>
            <label className="form-label">
              Slug <span className="form-required">*</span>
            </label>
            <SlugInput title={title} value={slug} onChange={setSlug} excludeId={blogId} />
          </div>

          {/* Excerpt */}
          <div>
            <label className="form-label">Excerpt (Optional)</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="form-input"
              rows={3}
              placeholder="Brief description of the blog post..."
              maxLength={500}
            />
            <p className="form-hint">{excerpt.length}/500 characters</p>
          </div>

          {/* Content */}
          <div>
            <label className="form-label">
              Content <span className="form-required">*</span>
            </label>
            <TipTapEditor content={content} onChange={setContent} />
          </div>

          {/* SEO Settings */}
          <div className="seo-section">
            <button
              type="button"
              onClick={() => setSeoExpanded(!seoExpanded)}
              className="seo-toggle"
            >
              <span className="seo-toggle-label">SEO Settings</span>
              <svg
                className={`seo-chevron${seoExpanded ? ' expanded' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {seoExpanded && (
              <div className="seo-fields">
                <div>
                  <label className="seo-label">Meta Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="form-input"
                    placeholder="Defaults to blog title"
                  />
                </div>
                <div>
                  <label className="seo-label">Meta Description</label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="form-input"
                    rows={2}
                    placeholder="Brief description for search engines..."
                  />
                </div>
                <div>
                  <label className="seo-label">Keywords</label>
                  <input
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    className="form-input"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="stack">
          {/* Publish Box */}
          <div className="card-sm stack-sm">
            <div>
              <label className="form-label">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BlogStatus)}
                className="form-input"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="form-label">
                Author Name <span className="form-required">*</span>
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="form-input"
                placeholder="Author name"
              />
            </div>

            <div className="separator stack-xs">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn btn-primary btn-full"
              >
                {saving ? 'Saving...' : 'Update Blog'}
              </button>
              {blog.status === 'published' && (
                <Link
                  href={`/blog/${blog.slug}`}
                  target="_blank"
                  className="btn btn-success btn-full"
                >
                  View on Site
                </Link>
              )}
              <button
                onClick={handleDelete}
                className="btn btn-danger btn-full"
              >
                Delete Blog
              </button>
            </div>
          </div>

          {/* Categories & Tags */}
          <div className="card-sm stack-sm">
            <div>
              <label className="form-label">Categories</label>
              <input
                type="text"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                className="form-input"
                placeholder="Technology, Web Dev"
              />
              <p className="form-hint-xs">Separate with commas</p>
            </div>

            <div>
              <label className="form-label">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="form-input"
                placeholder="nextjs, react, typescript"
              />
              <p className="form-hint-xs">Separate with commas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
