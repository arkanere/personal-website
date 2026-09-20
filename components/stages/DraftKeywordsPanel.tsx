'use client'

/**
 * Draft Keywords Panel
 *
 * The second pass over a brain dump: what is this actually about? The extract
 * button offers the most frequent words as a starting point, but the list is
 * edited by hand — picking the words is the thinking, not the counting.
 *
 * These are not the SEO keywords. These seed the twms; those describe the
 * finished article to a search engine.
 */

import { useState } from 'react'

interface DraftKeywordsPanelProps {
  keywords: string[]
  braindump: string
  onChange: (keywords: string[]) => void
}

/**
 * Words too common to be about anything. Kept short on purpose: a stopword
 * list that tries to be exhaustive ends up removing the interesting words too.
 */
const STOPWORDS = new Set([
  'the', 'and', 'that', 'this', 'with', 'for', 'are', 'but', 'not', 'you',
  'all', 'can', 'has', 'have', 'was', 'were', 'they', 'them', 'there', 'their',
  'what', 'when', 'which', 'who', 'will', 'would', 'could', 'should', 'from',
  'into', 'out', 'about', 'than', 'then', 'some', 'more', 'most', 'other',
  'such', 'only', 'very', 'just', 'like', 'also', 'been', 'being', 'does',
  'did', 'doing', 'how', 'why', 'its', "it's", 'our', 'your', 'his', 'her',
  'she', 'him', 'had', 'get', 'got', 'one', 'two', 'way', 'own', 'too', 'any',
])

function suggestDraftKeywords(text: string, existing: string[], limit = 12): string[] {
  const seen = new Set(existing.map(k => k.toLowerCase()))
  const counts = new Map<string, number>()

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w))

  for (const word of words) {
    counts.set(word, (counts.get(word) || 0) + 1)
  }

  return Array.from(counts.entries())
    .filter(([word]) => !seen.has(word))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word)
}

export default function DraftKeywordsPanel({
  keywords,
  braindump,
  onChange,
}: DraftKeywordsPanelProps) {
  const [draft, setDraft] = useState('')
  const [suggestions, setSuggestions] = useState<string[] | null>(null)

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
      <div className="keyword-chips">
        {keywords.length === 0 && (
          <span className="keyword-empty">No keywords yet</span>
        )}
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

      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { add(draft); setDraft('') }}
        className="form-input"
        placeholder="Type a keyword and press Enter..."
      />

      <div className="stage-panel-actions">
        <button
          type="button"
          onClick={() => setSuggestions(suggestDraftKeywords(braindump, keywords))}
          className="btn btn-secondary"
          disabled={braindump.trim() === ''}
        >
          Suggest from dump
        </button>
      </div>

      {suggestions !== null && (
        <div className="keyword-suggestions">
          {suggestions.length === 0 ? (
            <span className="keyword-empty">Nothing further to suggest</span>
          ) : (
            suggestions.map(word => (
              <button
                key={word}
                type="button"
                onClick={() => {
                  add(word)
                  setSuggestions(suggestions.filter(s => s !== word))
                }}
                className="keyword-suggestion"
              >
                + {word}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
