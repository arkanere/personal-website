'use client'

/**
 * Brain Dump Panel
 *
 * One plain textarea and nothing else. Formatting at this stage is
 * procrastination with a toolbar, and so is anything else on the screen.
 */

import { countWords } from '@/lib/lifecycle'

interface BrainDumpPanelProps {
  value: string
  onChange: (value: string) => void
}

export default function BrainDumpPanel({ value, onChange }: BrainDumpPanelProps) {
  return (
    <div className="stage-panel">
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
