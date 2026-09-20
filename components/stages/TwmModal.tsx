'use client'

/** Full-screen editor for one twm. Styles from 20wordsmax/ui.html. */

import { useEffect, useRef, useState } from 'react'
import { TWM_MAX_WORDS, countWords } from '@/lib/lifecycle'

interface TwmModalProps {
  /** '' when adding a new twm. */
  initialText: string
  onSave: (text: string) => void
  onCancel: () => void
}

export default function TwmModal({ initialText, onSave, onCancel }: TwmModalProps) {
  const [text, setText] = useState(initialText)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const words = countWords(text)
  const over = words > TWM_MAX_WORDS
  const canSave = words > 0 && !over

  useEffect(() => {
    textareaRef.current?.focus()
    textareaRef.current?.select()
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
    if (canSave) onSave(text.trim())
  }

  return (
    <div className="twm-modal active">
      <div className="twm-modal-content">
        <form onSubmit={handleSubmit}>
          <div className="twm-form-group">
            <label htmlFor="twm-text-input">TWM</label>
            <textarea
              id="twm-text-input"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {over && (
              <div className="twm-word-count show">
                {words} words (max {TWM_MAX_WORDS})
              </div>
            )}
          </div>
          <div className="twm-modal-buttons">
            <button type="button" className="twm-btn twm-btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="twm-btn twm-btn-primary" disabled={!canSave}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
