'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import TipTapEditor from '@/components/TipTapEditor'
import SlugInput from '@/components/SlugInput'
import SeriesPicker from '@/components/SeriesPicker'
import StageTabs, { WritingStage } from '@/components/StageTabs'
import BrainDumpPanel from '@/components/stages/BrainDumpPanel'
import DraftKeywordsPanel from '@/components/stages/DraftKeywordsPanel'
import TwmPanel from '@/components/stages/TwmPanel'
import { BlogStatus, Twm } from '@/lib/types/blog'
import { canPublish, composeDraft } from '@/lib/lifecycle'
import { useDebounce } from '@/lib/hooks/useDebounce'

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

  // Series membership
  const [seriesId, setSeriesId] = useState<number | null>(null)
  const [seriesOrder, setSeriesOrder] = useState('')
  const [isSeriesIndex, setIsSeriesIndex] = useState(false)

  // SEO fields
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState('')
  const [seoExpanded, setSeoExpanded] = useState(false)

  // The four stages. Which one is open is a view, not something to store.
  const [stage, setStage] = useState<WritingStage>('braindump')
  const [braindump, setBraindump] = useState('')
  const [draftKeywords, setDraftKeywords] = useState<string[]>([])
  const [twms, setTwms] = useState<Twm[]>([])
  const [autosave, setAutosave] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')

  // Set once autosave has created the row; from then on this page edits it.
  const [blogId, setBlogId] = useState<number | null>(null)

  // Auto-sync SEO title with main title
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (!seoTitle || seoTitle === title) {
      setSeoTitle(newTitle)
    }
  }

  /**
   * Autosave the writing, and only the writing. A brain dump is exactly the
   * thing written for twenty minutes without a thought about saving, so it
   * cannot depend on remembering a button — not even the first time, when
   * there is no blog yet. The first words written create the blog.
   *
   * Metadata — slug, status, series — is deliberately not autosaved: those are
   * decisions, and a half-made decision should not be written down.
   */
  const material = useMemo(
    () => ({ braindump, draft_keywords: draftKeywords, twms, content }),
    [braindump, draftKeywords, twms, content]
  )
  const debouncedMaterial = useDebounce(material, 1200)

  // What is already in the database, so an unchanged article is never written.
  const savedMaterial = useRef<string | null>(null)
  const creating = useRef(false)

  useEffect(() => {
    const serialized = JSON.stringify(debouncedMaterial)
    if (serialized === savedMaterial.current) return

    // Nothing has been written yet, so there is nothing to create or save.
    const written =
      debouncedMaterial.braindump.trim() !== '' ||
      debouncedMaterial.content.trim() !== '' ||
      debouncedMaterial.draft_keywords.length > 0 ||
      debouncedMaterial.twms.length > 0
    if (!written) return

    // One creation only; the effect runs again once the id arrives.
    if (creating.current) return

    let cancelled = false
    setAutosave('saving')

    const save = async () => {
      if (blogId === null) {
        creating.current = true
        const response = await fetch('/api/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // The title may still be unwritten, so the draft gets a
            // placeholder identity until the author decides on one.
            title: title.trim() || 'Untitled',
            slug: slug.trim() || `untitled-${Date.now()}`,
            author_name: authorName.trim() || session?.user?.name || 'Unknown',
            status: 'draft',
            ...debouncedMaterial,
            seo_metadata: {
              metaTitle: seoTitle.trim() || title.trim() || 'Untitled',
              metaDescription: seoDescription.trim(),
              keywords: seoKeywords.trim(),
            },
          }),
        })
        creating.current = false
        if (!response.ok) return false
        const data = await response.json()
        if (!cancelled) setBlogId(data.blog.id)
        return true
      }

      const response = await fetch(`/api/blogs/${blogId}/material`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
      })
      return response.ok
    }

    save()
      .then(ok => {
        if (cancelled) return
        if (ok) {
          savedMaterial.current = serialized
          setAutosave('saved')
        } else {
          setAutosave('failed')
        }
      })
      .catch(() => {
        creating.current = false
        if (!cancelled) setAutosave('failed')
      })

    return () => { cancelled = true }
    // The metadata read above is only a starting point for the created row,
    // so a change to it should not trigger a save on its own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMaterial, blogId])

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
    if (!authorName.trim()) {
      alert('Please enter an author name')
      return
    }
    const willPublish = publishNow || status === 'published'
    if (willPublish && !canPublish(content, { isSeriesIndex: publishAsIndex })) {
      alert('The final format is empty, so there is nothing to publish')
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
        series_id: seriesId,
        series_order: seriesOrder.trim() === '' ? null : parseInt(seriesOrder),
        is_series_index: seriesId !== null && isSeriesIndex,
        braindump,
        draft_keywords: draftKeywords,
        twms,
        seo_metadata: {
          metaTitle: seoTitle.trim() || title.trim(),
          metaDescription: seoDescription.trim(),
          keywords: seoKeywords.trim(),
        },
        published_at: publishNow ? new Date().toISOString() : null,
      }

      const response = blogId === null
        ? await fetch('/api/blogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blogData),
          })
        : await fetch(`/api/blogs/${blogId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blogData),
          })

      if (response.ok) {
        savedMaterial.current = JSON.stringify(material)
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

  /**
   * The twms become the final format. The twms are kept, so the finished
   * piece still carries the thinking behind it.
   */
  const handleCompose = () => {
    if (content.trim() !== '' && !confirm(
      'This will replace the final format with the composed twms. Continue?'
    )) {
      return
    }

    setContent(composeDraft(twms))
    setStage('final')
  }

  // Gates the Published option. The disabled option says enough on its own.
  const publishAsIndex = seriesId !== null && isSeriesIndex
  const publishable = canPublish(content, { isSeriesIndex: publishAsIndex })

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
            <SlugInput title={title} value={slug} onChange={setSlug} excludeId={blogId ?? undefined} />
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

          {/* The four stages */}
          <div className="stage-bar">
            <StageTabs stage={stage} onChange={setStage} />
            {autosave !== 'idle' && (
              <span className={'autosave' + (autosave === 'failed' ? ' failed' : '')}>
                {autosave === 'saving' ? 'Saving' : autosave === 'saved' ? 'Saved' : 'Not saved'}
              </span>
            )}
          </div>

          {stage === 'braindump' && (
            <BrainDumpPanel
              value={braindump}
              onChange={setBraindump}
              keywords={draftKeywords}
              onKeywordsChange={setDraftKeywords}
            />
          )}

          {stage === 'keywords' && (
            <DraftKeywordsPanel keywords={draftKeywords} onChange={setDraftKeywords} />
          )}

          {stage === 'twm' && (
            <TwmPanel
              twms={twms}
              keywords={draftKeywords}
              onChange={setTwms}
              onCompose={handleCompose}
            />
          )}

          {/* TipTap is mounted only on the final format, so the other stages
              carry no rich-text machinery at all. */}
          {stage === 'final' && (
            <TipTapEditor content={content} onChange={setContent} />
          )}

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
                  <label className="seo-label">SEO Keywords</label>
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
                <option value="published" disabled={!publishable}>
                  Published
                </option>
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
                disabled={loading || !publishable}
                className="btn btn-primary btn-full"
              >
                {loading ? 'Publishing...' : 'Publish Now'}
              </button>
            </div>
          </div>

          {/* Series */}
          <SeriesPicker
            seriesId={seriesId}
            onSeriesChange={setSeriesId}
            seriesOrder={seriesOrder}
            onOrderChange={setSeriesOrder}
            isSeriesIndex={isSeriesIndex}
            onIsSeriesIndexChange={setIsSeriesIndex}
          />

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
