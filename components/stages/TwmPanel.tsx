'use client'

/** An over-long twm blocks the final stage, as the API blocks it on save. */

import { useState } from 'react'
import { Twm } from '@/lib/types/blog'
import { TWM_MAX_WORDS, countWords, newTwmId } from '@/lib/lifecycle'
import TwmModal from './TwmModal'

interface TwmPanelProps {
  twms: Twm[]
  keywords: string[]
  onChange: (twms: Twm[]) => void
  onCompose: () => void
}

export default function TwmPanel({
  twms,
  keywords,
  onChange,
  onCompose,
}: TwmPanelProps) {
  // Which twm the modal is editing: an id, 'new', or null when it is closed.
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  const update = (id: string, patch: Partial<Twm>) => {
    onChange(twms.map(t => (t.id === id ? { ...t, ...patch } : t)))
  }

  const saveFromModal = (text: string) => {
    if (editing === 'new') {
      onChange([...twms, { id: newTwmId(), seed: null, text }])
    } else if (editing) {
      update(editing, { text })
    }
    setEditing(null)
  }

  /** One empty twm per keyword, skipping keywords that already have one. */
  const seedFromKeywords = () => {
    const seeded = new Set(twms.map(t => t.seed).filter(Boolean))
    const fresh = keywords
      .filter(k => !seeded.has(k))
      .map(k => ({ id: newTwmId(), seed: k, text: '' }))
    if (fresh.length > 0) onChange([...twms, ...fresh])
  }

  const remove = (id: string) => {
    onChange(twms.filter(t => t.id !== id))
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= twms.length) return
    const next = [...twms]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const overLong = twms.filter(t => countWords(t.text) > TWM_MAX_WORDS).length
  const written = twms.filter(t => t.text.trim() !== '').length
  const composeBlocker =
    written === 0 ? 'Write at least one twm first'
      : overLong > 0 ? `${overLong} twm(s) are over ${TWM_MAX_WORDS} words`
        : null

  return (
    <div className="stage-panel">
      <div className="twm-list">
        {twms.map((twm, index) => {
          const words = countWords(twm.text)
          const over = words > TWM_MAX_WORDS

          return (
            <div key={twm.id} className={'twm-row' + (over ? ' over' : '')}>
              <button
                type="button"
                className="twm-row-text"
                onClick={() => setEditing(twm.id)}
              >
                {twm.text.trim() === '' ? 'Empty twm' : twm.text}
              </button>

              <select
                value={twm.seed ?? ''}
                onChange={(e) => update(twm.id, { seed: e.target.value || null })}
                className="twm-seed"
              >
                <option value="">No seed</option>
                {keywords.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
                {/* A seed can outlive the keyword it came from. */}
                {twm.seed && !keywords.includes(twm.seed) && (
                  <option value={twm.seed}>{twm.seed}</option>
                )}
              </select>

              <span className={'twm-count' + (over ? ' over' : '')}>
                {words}/{TWM_MAX_WORDS}
              </span>

              <div className="twm-row-actions">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="twm-action"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === twms.length - 1}
                  className="twm-action"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(twm.id)}
                  className="twm-action twm-action-remove"
                  aria-label="Remove twm"
                >
                  ×
                </button>
              </div>
            </div>
          )
        })}

        {twms.length === 0 && (
          <p className="keyword-empty">No twms yet.</p>
        )}
      </div>

      <div className="stage-panel-actions">
        <button type="button" onClick={() => setEditing('new')} className="btn btn-secondary">
          Add twm
        </button>
        {keywords.length > 0 && (
          <button
            type="button"
            onClick={seedFromKeywords}
            className="btn btn-secondary"
            title="One empty twm per keyword"
          >
            Seed from keywords
          </button>
        )}
        <button
          type="button"
          onClick={onCompose}
          disabled={Boolean(composeBlocker)}
          title={composeBlocker || undefined}
          className="btn btn-primary"
        >
          Compose draft →
        </button>
      </div>

      {editing !== null && (
        <TwmModal
          initialText={editing === 'new' ? '' : twms.find(t => t.id === editing)?.text || ''}
          onSave={saveFromModal}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}
