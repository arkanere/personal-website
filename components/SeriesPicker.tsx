'use client'

/**
 * Series Picker
 * Sidebar box on the blog form that decides whether an article stands alone
 * or belongs to a series, and whether it is the article the series shows on
 * the home page.
 */

import { useEffect, useState } from 'react'
import { SeriesWithPosts } from '@/lib/types/blog'

interface SeriesPickerProps {
  seriesId: number | null
  onSeriesChange: (seriesId: number | null) => void
  seriesOrder: string
  onOrderChange: (order: string) => void
  isSeriesIndex: boolean
  onIsSeriesIndexChange: (isIndex: boolean) => void
  /** The blog being edited, so it isn't reported as its series' existing index. */
  blogId?: number
}

export default function SeriesPicker({
  seriesId,
  onSeriesChange,
  seriesOrder,
  onOrderChange,
  isSeriesIndex,
  onIsSeriesIndexChange,
  blogId,
}: SeriesPickerProps) {
  const [seriesList, setSeriesList] = useState<SeriesWithPosts[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await fetch('/api/series')
        if (response.ok) {
          const data = await response.json()
          setSeriesList(data.series)
        }
      } catch (error) {
        console.error('Error fetching series:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [])

  const selected = seriesList.find(s => s.id === seriesId)

  // Warn before stealing the index role from another article in the series.
  const currentIndex = selected?.index_blog_id ?? null
  const indexHeldByAnother = currentIndex !== null && currentIndex !== blogId
  const currentIndexTitle = indexHeldByAnother
    ? selected?.posts.find(p => p.id === currentIndex)?.title
    : undefined

  const handleSeriesChange = (value: string) => {
    if (value === '') {
      onSeriesChange(null)
      onOrderChange('')
      onIsSeriesIndexChange(false)
      return
    }
    onSeriesChange(parseInt(value))
  }

  return (
    <div className="card-sm stack-sm">
      <div>
        <label className="form-label">Series</label>
        <select
          value={seriesId ?? ''}
          onChange={(e) => handleSeriesChange(e.target.value)}
          className="form-input"
          disabled={loading}
        >
          <option value="">
            {loading ? 'Loading series...' : 'None — independent article'}
          </option>
          {seriesList.map((series) => (
            <option key={series.id} value={series.id}>
              {series.title}
            </option>
          ))}
        </select>
        <p className="form-hint-xs">
          {seriesId
            ? 'Listed on the home page only if it is the series index.'
            : 'Listed on the home page on its own.'}
        </p>
      </div>

      {seriesId !== null && (
        <>
          <div>
            <label className="form-label">Order in Series</label>
            <input
              type="number"
              value={seriesOrder}
              onChange={(e) => onOrderChange(e.target.value)}
              className="form-input"
              placeholder="1"
              min={0}
            />
            <p className="form-hint-xs">Leave blank to sort last</p>
          </div>

          <div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={isSeriesIndex}
                onChange={(e) => onIsSeriesIndexChange(e.target.checked)}
              />
              <span>This is the series index</span>
            </label>
            <p className="form-hint-xs">
              {indexHeldByAnother && isSeriesIndex
                ? `Replaces "${currentIndexTitle}" as the index.`
                : indexHeldByAnother
                ? `Currently "${currentIndexTitle}".`
                : 'The article this series shows on the home page.'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
