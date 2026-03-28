'use client'

/**
 * Create Blog Page
 * Form to create a new blog post
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import TipTapEditor from '@/components/TipTapEditor'
import SlugInput from '@/components/SlugInput'
import { BlogStatus } from '@/lib/types/blog'

export default function CreateBlogPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [authorName, setAuthorName] = useState(session?.user?.name || '')
  const [status, setStatus] = useState<BlogStatus>('draft')
  const [tags, setTags] = useState('')
  const [categories, setCategories] = useState('')

  // SEO fields
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [seoExpanded, setSeoExpanded] = useState(false)

  // Auto-sync SEO title with main title
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (!seoTitle || seoTitle === title) {
      setSeoTitle(newTitle)
    }
  }

  const handleSubmit = async (publishNow = false) => {
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

    setLoading(true)

    try {
      const blogData = {
        title: title.trim(),
        slug: slug.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || null,
        author_name: authorName.trim(),
        status: publishNow ? 'published' : status,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        categories: categories.split(',').map(c => c.trim()).filter(c => c),
        seo_metadata: {
          metaTitle: seoTitle.trim() || title.trim(),
          metaDescription: seoDescription.trim(),
          keywords: seoKeywords.trim(),
        },
        published_at: publishNow ? new Date().toISOString() : null,
      }

      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogData),
      })

      if (response.ok) {
        const data = await response.json()
        router.push('/admin/blogs')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create blog')
      }
    } catch (error) {
      console.error('Error creating blog:', error)
      alert('An error occurred while creating the blog')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-content-wide">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="admin-page-title">Create New Blog</h1>
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
              onChange={(e) => handleTitleChange(e.target.value)}
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
            <SlugInput title={title} value={slug} onChange={setSlug} />
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
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="btn btn-secondary btn-full"
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="btn btn-primary btn-full"
              >
                {loading ? 'Publishing...' : 'Publish Now'}
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
