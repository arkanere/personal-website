'use client'

/**
 * Brain Dump Panel
 *
 * One plain textarea, deliberately. Formatting at this stage is procrastination
 * with a toolbar, so there isn't one — the only job here is to get it out.
 */

import { countWords } from '@/lib/lifecycle'

interface BrainDumpPanelProps {
  value: string
  onChange: (value: string) => void
}

export default function BrainDumpPanel({ value, onChange }: BrainDumpPanelProps) {
  return (
    <div className="stage-panel">
      <p className="stage-panel-hint">
        Write whatever comes, in whatever order. Nothing here is shown anywhere —
        it is raw material, and it stays with the article once it is finished.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="braindump-textarea"
        rows={18}
        placeholder="Just start writing..."
        autoFocus
      />
      <p className="form-hint">{countWords(value)} words</p>
    </div>
  )
}
