'use client'

/**
 * Stage Stepper
 *
 * The four stages of writing an article. Any of them can be opened at any
 * time: they are places to work, not steps to be unlocked.
 */

import { BlogStage } from '@/lib/types/blog'
import { STAGES, STAGE_LABELS, stageIndex } from '@/lib/lifecycle'

interface StageStepperProps {
  stage: BlogStage
  /** A published article stays on the final stage until it is unpublished. */
  locked?: boolean
  busy?: boolean
  onStageChange: (stage: BlogStage) => void
}

export default function StageStepper({
  stage,
  locked = false,
  busy = false,
  onStageChange,
}: StageStepperProps) {
  const currentIndex = stageIndex(stage)

  return (
    <div className="stage-stepper">
      <ol className="stage-list">
        {STAGES.map((candidate, index) => {
          const isCurrent = candidate === stage
          const isDone = index < currentIndex
          const lockedHere = locked && candidate !== 'final'

          return (
            <li key={candidate} className="stage-item">
              <button
                type="button"
                onClick={() => onStageChange(candidate)}
                disabled={busy || isCurrent || lockedHere}
                title={lockedHere ? 'Unpublish this article to move it back' : undefined}
                className={
                  'stage-step' +
                  (isCurrent ? ' current' : '') +
                  (isDone ? ' done' : '') +
                  (lockedHere ? ' blocked' : '')
                }
              >
                <span className="stage-step-number">{index + 1}</span>
                <span className="stage-step-label">{STAGE_LABELS[candidate]}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
