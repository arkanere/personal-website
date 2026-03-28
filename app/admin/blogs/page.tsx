'use client'

/**
 * Admin Blog List Page
 * Displays all blogs with search, filter, and management capabilities
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BlogListItem, BlogStatus } from '@/lib/types/blog'
import StatusBadge from '@/components/StatusBadge'

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogListItem[]>([])
  const [filteredBlogs, setFilteredBlogs] = useState<BlogListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<BlogStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-viewed'>('newest')

  // Fetch blogs
  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
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
  }

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

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else {
        return b.view_count - a.view_count
      }
    })

    setFilteredBlogs(result)
  }, [blogs, searchQuery, statusFilter, sortBy])

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/blogs/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setBlogs(blogs.filter(blog => blog.id !== id))
      } else {
        alert('Failed to delete blog')
      }
    } catch (error) {
      console.error('Error deleting blog:', error)
      alert('An error occurred while deleting the blog')
    }
  }

  // Statistics
  const stats = {
    total: blogs.length,
    draft: blogs.filter(b => b.status === 'draft').length,
    published: blogs.filter(b => b.status === 'published').length,
    archived: blogs.filter(b => b.status === 'archived').length,
  }

  return (
    <div className="stack">
      {/* Header */}
      <div className="flex-between">
        <h1 className="admin-page-title">Blog Management</h1>
        <Link href="/admin/blogs/create" className="btn btn-primary">
          Create New Blog
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid-4">
        <div className="card">
          <p className="stat-label">Total Blogs</p>
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

      {/* Filters */}
      <div className="card-sm">
        <div className="grid-3">
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
            <label className="form-label">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="form-input"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most-viewed">Most Viewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blog List */}
      <div className="table-card">
        {loading ? (
          <div className="empty-state">Loading blogs...</div>
        ) : filteredBlogs.length === 0 ? (
          <div className="empty-state">
            {searchQuery || statusFilter !== 'all'
              ? 'No blogs match your filters'
              : 'No blogs yet. Create your first blog!'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Author</th>
                  <th>Published</th>
                  <th>Views</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id}>
                    <td>
                      <div className="table-title">{blog.title}</div>
                      {blog.excerpt && (
                        <div className="table-excerpt">{blog.excerpt}</div>
                      )}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
