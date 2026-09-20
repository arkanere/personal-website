'use client'

/**
 * Draft Keywords Panel
 *
 * The concepts pulled out of a brain dump, which go on to seed the twms.
 * Not the SEO keywords: those describe the finished article to a search engine.
 */

import { useState } from 'react'

interface DraftKeywordsPanelProps {
  keywords: string[]
  onChange: (keywords: string[]) => void
}

export default function DraftKeywordsPanel({
  keywords,
  onChange,
}: DraftKeywordsPanelProps) {
  const [draft, setDraft] = useState('')

  const add = (raw: string) => {
    const keyword = raw.trim()
    if (keyword === '') return
    if (keywords.some(k => k.toLowerCase() === keyword.toLowerCase())) return
    onChange([...keywords, keyword])
  }

  const remove = (keyword: string) => {
    onChange(keywords.filter(k => k !== keyword))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter and comma both commit, since both are how people type lists.
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
      setDraft('')
    } else if (e.key === 'Backspace' && draft === '' && keywords.length > 0) {
      onChange(keywords.slice(0, -1))
    }
  }

  return (
    <div className="stage-panel">
      {keywords.length > 0 && (
        <div className="keyword-chips">
          {keywords.map(keyword => (
            <span key={keyword} className="keyword-chip">
              {keyword}
              <button
                type="button"
                onClick={() => remove(keyword)}
                className="keyword-chip-remove"
                aria-label={`Remove ${keyword}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { add(draft); setDraft('') }}
        className="form-input"
        placeholder="Type a keyword and press Enter..."
      />
    </div>
  )
}
