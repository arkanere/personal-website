'use client'

/**
 * Keyword Modal
 *
 * The same modal as a twm, with no word ceiling: a keyword is a concept, not
 * a sentence, so there is nothing to cap.
 */

import { useEffect, useRef, useState } from 'react'

interface KeywordModalProps {
  initialText: string
  onSave: (text: string) => void
  onCancel: () => void
}

export default function KeywordModal({ initialText, onSave, onCancel }: KeywordModalProps) {
  const [text, setText] = useState(initialText)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() !== '') onSave(text.trim())
  }

  return (
    <div className="twm-modal active">
      <div className="twm-modal-content keyword-modal-content">
        <form onSubmit={handleSubmit}>
          <div className="twm-form-group">
            <label htmlFor="keyword-text-input">KEYWORD</label>
            <input
              id="keyword-text-input"
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="twm-modal-buttons">
            <button type="button" className="twm-btn twm-btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="twm-btn twm-btn-primary" disabled={text.trim() === ''}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
