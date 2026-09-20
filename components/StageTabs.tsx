'use client'

/** The four writing stages. Any of them can be opened at any time. */

export type WritingStage = 'braindump' | 'keywords' | 'twm' | 'final'

export const WRITING_STAGES: { id: WritingStage; label: string }[] = [
  { id: 'braindump', label: 'Brain Dump' },
  { id: 'keywords', label: 'Draft Keywords' },
  { id: 'twm', label: '20 Words Max' },
  { id: 'final', label: 'Final Format' },
]

interface StageTabsProps {
  stage: WritingStage
  onChange: (stage: WritingStage) => void
}

export default function StageTabs({ stage, onChange }: StageTabsProps) {
  return (
    <div className="stage-tabs">
      {WRITING_STAGES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={'stage-tab' + (id === stage ? ' current' : '')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
