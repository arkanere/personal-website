'use client'

/**
 * TWM Panel
 *
 * Twenty words max, per unit. The counter is not a suggestion: the ceiling is
 * the primitive, and an over-long twm blocks the move to the final stage the
 * same way the API blocks it on save.
 */

import { Twm } from '@/lib/types/blog'
import { TWM_MAX_WORDS, countWords, newTwmId } from '@/lib/lifecycle'

interface TwmPanelProps {
  twms: Twm[]
  keywords: string[]
  onChange: (twms: Twm[]) => void
  onCompose: () => void
  composing?: boolean
}

export default function TwmPanel({
  twms,
  keywords,
  onChange,
  onCompose,
  composing = false,
}: TwmPanelProps) {
  const update = (id: string, patch: Partial<Twm>) => {
    onChange(twms.map(t => (t.id === id ? { ...t, ...patch } : t)))
  }

  const add = (seed: string | null = null) => {
    onChange([...twms, { id: newTwmId(), seed, text: '' }])
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
  const empty = twms.filter(t => t.text.trim() === '').length
  const composeBlocker =
    twms.length === 0 ? 'Write at least one twm first'
      : overLong > 0 ? `${overLong} twm(s) are over ${TWM_MAX_WORDS} words`
        : empty === twms.length ? 'Every twm is empty'
          : null

  return (
    <div className="stage-panel">
      <div className="twm-list">
        {twms.map((twm, index) => {
          const words = countWords(twm.text)
          const over = words > TWM_MAX_WORDS

          return (
            <div key={twm.id} className={'twm-row' + (over ? ' over' : '')}>
              <div className="twm-row-main">
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

                <input
                  type="text"
                  value={twm.text}
                  onChange={(e) => update(twm.id, { text: e.target.value })}
                  className="twm-text"
                  placeholder="Say it in twenty words or fewer..."
                />

                <span className={'twm-count' + (over ? ' over' : '')}>
                  {words}/{TWM_MAX_WORDS}
                </span>
              </div>

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
        <button type="button" onClick={() => add()} className="btn btn-secondary">
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
          disabled={composing || Boolean(composeBlocker)}
          title={composeBlocker || undefined}
          className="btn btn-primary"
        >
          {composing ? 'Composing...' : 'Compose draft →'}
        </button>
      </div>
    </div>
  )
}
