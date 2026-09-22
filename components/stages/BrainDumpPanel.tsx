'use client'

import { useRef, useState } from 'react'
import BrainDumpHighlights from './BrainDumpHighlights'
import { addDraftKeyword, countWords } from '@/lib/lifecycle'

interface BrainDumpPanelProps {
  value: string
  onChange: (value: string) => void
  keywords: string[]
  onKeywordsChange: (keywords: string[]) => void
}

export default function BrainDumpPanel({
  value,
  onChange,
  keywords,
  onKeywordsChange,
}: BrainDumpPanelProps) {
  const highlightsRef = useRef<HTMLDivElement>(null)
  // The selected text and where to float the pill, or null when nothing is selected.
  const [pill, setPill] = useState<{ text: string; x: number; y: number } | null>(null)

  const hidePill = () => setPill(current => (current === null ? current : null))

  // Select text in the dump, then click the pill to make it a keyword. Both
  // stages read the same list, so it shows up under Keywords straight away.
  const showPill = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const selected = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd).trim()
    if (selected === '') return hidePill()

    const box = textarea.parentElement!.getBoundingClientRect()
    setPill({ text: selected, x: e.clientX - box.left, y: e.clientY - box.top + 14 })
  }

  const addKeyword = () => {
    if (pill) onKeywordsChange(addDraftKeyword(keywords, pill.text))
    setPill(null)
  }

  return (
    <div className="stage-panel">
      <div className="braindump-field">
        <BrainDumpHighlights ref={highlightsRef} text={value} keywords={keywords} />
        <textarea
          value={value}
          onChange={(e) => {
            hidePill()
            onChange(e.target.value)
          }}
          onScroll={(e) => {
            hidePill()
            if (highlightsRef.current) {
              highlightsRef.current.scrollTop = e.currentTarget.scrollTop
            }
          }}
          onMouseUp={showPill}
          onBlur={hidePill}
          className="braindump-textarea"
          rows={18}
          placeholder="Just start writing..."
          autoFocus
        />
        {pill && (
          <button
            type="button"
            className="braindump-pill"
            style={{ left: pill.x, top: pill.y }}
            // mousedown would drop the textarea's selection before the click lands.
            onMouseDown={(e) => e.preventDefault()}
            onClick={addKeyword}
          >
            + Keyword
          </button>
        )}
      </div>
      <p className="form-hint">{countWords(value)} words</p>
    </div>
  )
}
