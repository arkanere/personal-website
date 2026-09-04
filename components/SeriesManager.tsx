'use client'

/**
 * Series Manager
 * Panel on the admin blog list for creating series, renaming them, choosing
 * which member article a series shows on the home page, and deleting a series
 * without deleting its articles.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { SeriesWithPosts } from '@/lib/types/blog'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

interface SeriesManagerProps {
  /** Called after any change, so the blog list can pick up new series labels. */
  onSeriesChanged: () => void
}

export default function SeriesManager({ onSeriesChanged }: SeriesManagerProps) {
  const [series, setSeries] = useState<SeriesWithPosts[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(true)

  // New series form
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newDescription, setNewDescription] = useState('')

  // Inline rename
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/series')
      if (response.ok) {
        const data = await response.json()
        setSeries(data.series)
      }
    } catch (error) {
      console.error('Error fetching series:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSeries()
  }, [fetchSeries])

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      alert('Please enter a series title')
      return
    }

    const slug = newSlug.trim() || slugify(newTitle)
    if (!slug) {
      alert('Please enter a valid slug')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug,
          description: newDescription.trim() || null,
        }),
      })

      if (response.ok) {
        setNewTitle('')
        setNewSlug('')
        setNewDescription('')
        setCreating(false)
        await fetchSeries()
        onSeriesChanged()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create series')
      }
    } catch (error) {
      console.error('Error creating series:', error)
      alert('An error occurred while creating the series')
    } finally {
      setSaving(false)
    }
  }

  const updateSeries = async (
    item: SeriesWithPosts,
    changes: Partial<{ title: string; slug: string; description: string | null; index_blog_id: number | null }>
  ) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/series/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          slug: item.slug,
          description: item.description,
          index_blog_id: item.index_blog_id,
          ...changes,
        }),
      })

      if (response.ok) {
        await fetchSeries()
        onSeriesChanged()
        return true
      }

      const error = await response.json()
      alert(error.error || 'Failed to update series')
      return false
    } catch (error) {
      console.error('Error updating series:', error)
      alert('An error occurred while updating the series')
      return false
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (item: SeriesWithPosts) => {
    setEditingId(item.id)
    setEditTitle(item.title)
    setEditSlug(item.slug)
    setEditDescription(item.description || '')
  }

  const handleSaveEdit = async (item: SeriesWithPosts) => {
    if (!editTitle.trim() || !editSlug.trim()) {
      alert('Title and slug are required')
      return
    }

    const ok = await updateSeries(item, {
      title: editTitle.trim(),
      slug: editSlug.trim(),
      description: editDescription.trim() || null,
    })

    if (ok) setEditingId(null)
  }

  const handleDelete = async (item: SeriesWithPosts) => {
    const count = item.posts.length
    const message = count === 0
      ? `Delete the series "${item.title}"?`
      : `Delete the series "${item.title}"?\n\nIts ${count} article(s) will NOT be deleted — they become independent articles and reappear on the home page.`

    if (!confirm(message)) return

    setSaving(true)
    try {
      const response = await fetch(`/api/series/${item.id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchSeries()
        onSeriesChanged()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete series')
      }
    } catch (error) {
      console.error('Error deleting series:', error)
      alert('An error occurred while deleting the series')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card-sm stack-sm">
      <div className="flex-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="series-toggle"
        >
          <svg
            className={`seo-chevron${expanded ? ' expanded' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="seo-toggle-label">
            Series {loading ? '' : `(${series.length})`}
          </span>
        </button>
        <button
          type="button"
          onClick={() => { setExpanded(true); setCreating(true) }}
          className="btn btn-secondary"
        >
          New Series
        </button>
      </div>

      {expanded && (
        <div className="stack-sm">
          {loading ? (
            <div className="empty-state">Loading series...</div>
          ) : series.length === 0 ? (
            <div className="empty-state">
              No series yet. Create one, then assign articles to it from the blog editor.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Series</th>
                    <th>Index Article (shown on home page)</th>
                    <th>Articles</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((item) => (
                    <tr key={item.id}>
                      {editingId === item.id ? (
                        <>
                          <td colSpan={3}>
                            <div className="stack-xs">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="form-input"
                                placeholder="Series title"
                              />
                              <input
                                type="text"
                                value={editSlug}
                                onChange={(e) => setEditSlug(e.target.value)}
                                className="form-input"
                                placeholder="series-slug"
                              />
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="form-input"
                                rows={2}
                                placeholder="Description (optional)"
                              />
                            </div>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                onClick={() => handleSaveEdit(item)}
                                disabled={saving}
                                className="link-blue"
                              >
                                Save
                              </button>
                              <button onClick={() => setEditingId(null)} className="link-red">
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <div className="table-title">{item.title}</div>
                            <div className="table-excerpt">/{item.slug}</div>
                          </td>
                          <td>
                            <select
                              value={item.index_blog_id ?? ''}
                              onChange={(e) =>
                                updateSeries(item, {
                                  index_blog_id: e.target.value === '' ? null : parseInt(e.target.value),
                                })
                              }
                              className="form-input"
                              disabled={saving || item.posts.length === 0}
                            >
                              <option value="">
                                {item.posts.length === 0
                                  ? 'No articles in this series'
                                  : 'None — series is unlisted'}
                              </option>
                              {item.posts.map((post) => (
                                <option key={post.id} value={post.id}>
                                  {post.title}
                                  {post.status !== 'published' ? ` (${post.status})` : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="table-muted">{item.posts.length}</td>
                          <td>
                            <div className="table-actions">
                              <button onClick={() => startEditing(item)} className="link-blue">
                                Rename
                              </button>
                              {item.index_blog_id && (
                                <Link
                                  href={`/admin/blogs/${item.index_blog_id}/edit`}
                                  className="link-green"
                                >
                                  Edit Index
                                </Link>
                              )}
                              <button
                                onClick={() => handleDelete(item)}
                                disabled={saving}
                                className="link-red"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {creating && (
            <div className="card-sm stack-xs">
              <div>
                <label className="form-label">Series Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="form-input"
                  placeholder="Building a Compiler"
                  maxLength={255}
                />
              </div>
              <div>
                <label className="form-label">Slug</label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="form-input"
                  placeholder={slugify(newTitle) || 'building-a-compiler'}
                />
                <p className="form-hint-xs">Leave blank to generate from the title</p>
              </div>
              <div>
                <label className="form-label">Description (Optional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="form-input"
                  rows={2}
                  placeholder="What this series covers..."
                />
              </div>
              <div className="table-actions">
                <button onClick={handleCreate} disabled={saving} className="btn btn-primary">
                  {saving ? 'Creating...' : 'Create Series'}
                </button>
                <button onClick={() => setCreating(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
