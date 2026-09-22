'use client'

/** Series members are grouped under their series, with the index marked. */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { BlogListItem, BlogStatus } from '@/lib/types/blog'
import StatusBadge from '@/components/StatusBadge'
import SeriesManager from '@/components/SeriesManager'

/** A series' articles, or the bucket of independent articles when id is null. */
interface BlogGroup {
  id: number | null
  title: string
  blogs: BlogListItem[]
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogListItem[]>([])
  const [filteredBlogs, setFilteredBlogs] = useState<BlogListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<BlogStatus | 'all'>('all')
  const [seriesFilter, setSeriesFilter] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagMatch, setTagMatch] = useState<'and' | 'or'>('and')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-viewed'>('newest')
  const [groupBySeries, setGroupBySeries] = useState(true)

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/blogs')
      if (response.ok) {
        const data = await response.json()
        setBlogs(data.blogs)
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch blogs
  useEffect(() => {
    fetchBlogs()
  }, [fetchBlogs])

  // Filter and sort blogs
  useEffect(() => {
    let result = [...blogs]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(blog =>
        blog.title.toLowerCase().includes(query) ||
        (blog.excerpt && blog.excerpt.toLowerCase().includes(query))
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(blog => blog.status === statusFilter)
    }

    // Filter by series membership
    if (seriesFilter === 'none') {
      result = result.filter(blog => blog.series_id === null)
    } else if (seriesFilter !== 'all') {
      result = result.filter(blog => blog.series_id === parseInt(seriesFilter))
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      result = result.filter(blog => {
        const tags = blog.tags || []
        return tagMatch === 'and'
          ? selectedTags.every(tag => tags.includes(tag))
          : selectedTags.some(tag => tags.includes(tag))
      })
    }

    // Sort: published articles come first, then drafts, then archived.
    // The chosen sort order applies within each status band.
    const statusRank = (status: string) =>
      status === 'published' ? 0 : status === 'draft' ? 1 : 2

    result.sort((a, b) => {
      const byStatus = statusRank(a.status) - statusRank(b.status)
      if (byStatus !== 0) return byStatus

      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else {
        return b.view_count - a.view_count
      }
    })

    setFilteredBlogs(result)
  }, [blogs, searchQuery, statusFilter, seriesFilter, selectedTags, tagMatch, sortBy])

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/blogs/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setBlogs(blogs.filter(blog => blog.id !== id))
      } else {
        alert('Failed to delete piece')
      }
    } catch (error) {
      console.error('Error deleting blog:', error)
      alert('An error occurred while deleting the piece')
    }
  }

  // The series present in the current data, for the filter dropdown
  const knownSeries = Array.from(
    new Map(
      blogs
        .filter(blog => blog.series_id !== null)
        .map(blog => [blog.series_id as number, blog.series_title as string])
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]))

  // Every tag in use, with how many blogs carry it. Counts are over all
  // blogs, so they stay steady as tags are selected.
  const tagCounts = new Map<string, number>()
  for (const blog of blogs) {
    for (const tag of blog.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    }
  }
  const knownTags = Array.from(tagCounts.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  )

  const toggleTag = (tag: string) => {
    setSelectedTags(current =>
      current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag]
    )
  }

  /**
   * Series members read as a hierarchy: one group per series in reading order,
   * then the independent articles. Grouping is only meaningful when a series
   * is actually involved, so a flat list is offered too.
   */
  const buildGroups = (): BlogGroup[] => {
    const seriesGroups = new Map<number, BlogGroup>()
    const independent: BlogListItem[] = []

    for (const blog of filteredBlogs) {
      if (blog.series_id === null) {
        independent.push(blog)
        continue
      }

      if (!seriesGroups.has(blog.series_id)) {
        seriesGroups.set(blog.series_id, {
          id: blog.series_id,
          title: blog.series_title || 'Untitled series',
          blogs: [],
        })
      }
      seriesGroups.get(blog.series_id)!.blogs.push(blog)
    }

    // Within a series, reading order wins over the global sort.
    // Unordered articles sort last, then by title.
    for (const group of seriesGroups.values()) {
      group.blogs.sort((a, b) => {
        if (a.series_order === null && b.series_order === null) {
          return a.title.localeCompare(b.title)
        }
        if (a.series_order === null) return 1
        if (b.series_order === null) return -1
        return a.series_order - b.series_order
      })
    }

    const groups = Array.from(seriesGroups.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    )

    if (independent.length > 0) {
      groups.push({ id: null, title: 'Independent Articles', blogs: independent })
    }

    return groups
  }

  const groups = groupBySeries
    ? buildGroups()
    : [{ id: null, title: '', blogs: filteredBlogs }]

  // Statistics
  const stats = {
    total: blogs.length,
    draft: blogs.filter(b => b.status === 'draft').length,
    published: blogs.filter(b => b.status === 'published').length,
    archived: blogs.filter(b => b.status === 'archived').length,
  }

  const renderRow = (blog: BlogListItem) => (
    <tr key={blog.id}>
      <td>
        <div className="table-title">
          {blog.series_order !== null && (
            <span className="series-order">{blog.series_order}.</span>
          )}
          {blog.title}
          {blog.is_series_index && (
            <span className="badge badge-index">Index</span>
          )}
        </div>
        {blog.excerpt && (
          <div className="table-excerpt">{blog.excerpt}</div>
        )}
      </td>
      <td className="table-muted">
        {blog.series_title || <span className="table-muted">Independent</span>}
      </td>
      <td className="table-muted">
        <StatusBadge status={blog.status} />
      </td>
      <td className="table-muted">{blog.author_name}</td>
      <td className="table-muted">
        {blog.published_at
          ? new Date(blog.published_at).toLocaleDateString()
          : '-'}
      </td>
      <td className="table-muted">{blog.view_count}</td>
      <td>
        <div className="table-actions">
          <Link href={`/admin/blogs/${blog.id}/edit`} className="link-blue">
            Edit
          </Link>
          {blog.status === 'published' && (
            <Link href={`/blog/${blog.slug}`} target="_blank" className="link-green">
              View
            </Link>
          )}
          <button
            onClick={() => handleDelete(blog.id, blog.title)}
            className="link-red"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className="stack">
      {/* Header */}
      <div className="flex-between">
        <h1 className="admin-page-title">Piece Management</h1>
        <Link href="/admin/blogs/create" className="btn btn-primary">
          Create New Piece
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid-4">
        <div className="card">
          <p className="stat-label">Total Pieces</p>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="card">
          <p className="stat-label">Published</p>
          <p className="stat-value stat-green">{stats.published}</p>
        </div>
        <div className="card">
          <p className="stat-label">Drafts</p>
          <p className="stat-value stat-yellow">{stats.draft}</p>
        </div>
        <div className="card">
          <p className="stat-label">Archived</p>
          <p className="stat-value stat-muted">{stats.archived}</p>
        </div>
      </div>

      {/* Series Management */}
      <SeriesManager onSeriesChanged={fetchBlogs} />

      {/* Filters */}
      <div className="card-sm stack-sm">
        <div className="grid-4">
          <div>
            <label className="form-label">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or excerpt..."
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BlogStatus | 'all')}
              className="form-input"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="form-label">Series</label>
            <select
              value={seriesFilter}
              onChange={(e) => setSeriesFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All</option>
              <option value="none">Independent only</option>
              {knownSeries.map(([id, title]) => (
                <option key={id} value={id}>{title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'most-viewed')}
              className="form-input"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most-viewed">Most Viewed</option>
            </select>
          </div>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={groupBySeries}
            onChange={(e) => setGroupBySeries(e.target.checked)}
          />
          <span>Group by series</span>
        </label>
      </div>

      {/* Tags */}
      {knownTags.length > 0 && (
        <div className="card-sm stack-sm">
          <div className="tag-header">
            <label className="form-label">Tags</label>
            <select
              value={tagMatch}
              onChange={(e) => setTagMatch(e.target.value as 'and' | 'or')}
              className="form-input tag-match"
            >
              <option value="and">Match all (AND)</option>
              <option value="or">Match any (OR)</option>
            </select>
          </div>
          <div className="tag-list">
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className={`tag-pill${selectedTags.length === 0 ? ' tag-pill-active' : ''}`}
            >
              All
            </button>
            {knownTags.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`tag-pill${selectedTags.includes(tag) ? ' tag-pill-active' : ''}`}
              >
                {tag}
                <span className="tag-count">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Blog List */}
      <div className="table-card">
        {loading ? (
          <div className="empty-state">Loading pieces...</div>
        ) : filteredBlogs.length === 0 ? (
          <div className="empty-state">
            {searchQuery || statusFilter !== 'all' || seriesFilter !== 'all' || selectedTags.length > 0
              ? 'No pieces match your filters'
              : 'No pieces yet. Create your first piece!'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Series</th>
                  <th>Status</th>
                  <th>Author</th>
                  <th>Published</th>
                  <th>Views</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              {groups.map((group) => (
                <tbody key={group.id ?? 'independent'}>
                  {groupBySeries && (
                    <tr className="group-row">
                      <td colSpan={7}>
                        {group.title}
                        <span className="group-count">
                          {group.blogs.length} {group.blogs.length === 1 ? 'article' : 'articles'}
                        </span>
                      </td>
                    </tr>
                  )}
                  {group.blogs.map(renderRow)}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
