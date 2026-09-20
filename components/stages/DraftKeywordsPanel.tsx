'use client'

/**
 * Draft Keywords Panel
 *
 * The concepts pulled out of a brain dump, which go on to seed the twms.
 * Not the SEO keywords: those describe the finished article to a search engine.
 *
 * Laid out like the twm prototype's primitives: a + to add, and the list below.
 */

import { useState } from 'react'
import KeywordModal from './KeywordModal'

interface DraftKeywordsPanelProps {
  keywords: string[]
  onChange: (keywords: string[]) => void
}

export default function DraftKeywordsPanel({
  keywords,
  onChange,
}: DraftKeywordsPanelProps) {
  // Which keyword the modal is editing: an index, 'new', or null when closed.
  const [editing, setEditing] = useState<number | 'new' | null>(null)

  const save = (value: string) => {
    const keyword = value.trim()
    if (keyword === '') return setEditing(null)

    const clash = keywords.findIndex(k => k.toLowerCase() === keyword.toLowerCase())

    if (editing === 'new') {
      if (clash === -1) onChange([...keywords, keyword])
    } else if (typeof editing === 'number') {
      if (clash === -1 || clash === editing) {
        onChange(keywords.map((k, i) => (i === editing ? keyword : k)))
      }
    }
    setEditing(null)
  }

  const remove = (index: number) => {
    onChange(keywords.filter((_, i) => i !== index))
  }

  return (
    <div className="stage-panel">
      <div className="primitive-header">
        <h3 className="primitive-heading">Draft Keywords</h3>
        <button type="button" className="primitive-add" onClick={() => setEditing('new')}>
          +
        </button>
      </div>

      {keywords.length === 0 ? (
        <p className="primitive-empty">No keywords yet</p>
      ) : (
        keywords.map((keyword, index) => (
          <div key={keyword} className="primitive-row">
            <p className="primitive-text">{keyword}</p>
            <div className="primitive-actions">
              <button
                type="button"
                className="primitive-edit"
                onClick={() => setEditing(index)}
                aria-label={`Edit ${keyword}`}
              >
                ✎
              </button>
              <button
                type="button"
                className="primitive-delete"
                onClick={() => remove(index)}
                aria-label={`Remove ${keyword}`}
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}

      {editing !== null && (
        <KeywordModal
          initialText={editing === 'new' ? '' : keywords[editing]}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}
