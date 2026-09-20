'use client'

/**
 * Stage Stepper
 *
 * The four stages of writing an article, with the gates made visible: a stage
 * you cannot enter yet is disabled and says why, rather than failing on click.
 */

import { BlogStage } from '@/lib/types/blog'
import { STAGES, STAGE_LABELS, stageEntryBlocker, stageIndex } from '@/lib/lifecycle'
import { Workspace } from '@/lib/types/blog'

interface StageStepperProps {
  stage: BlogStage
  workspace: Workspace
  /** Published articles are pinned to the final stage until unpublished. */
  locked?: boolean
  /** An article with content can always return to the final stage. */
  hasContent?: boolean
  busy?: boolean
  onStageChange: (stage: BlogStage) => void
}

export default function StageStepper({
  stage,
  workspace,
  locked = false,
  hasContent = false,
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
          const blocker = stageEntryBlocker(workspace, candidate, { hasContent })
          const lockedHere = locked && candidate !== 'final'
          const disabled = busy || isCurrent || lockedHere || Boolean(blocker)

          const title = isCurrent
            ? undefined
            : lockedHere
              ? 'Unpublish this article before moving it back'
              : blocker || undefined

          return (
            <li key={candidate} className="stage-item">
              <button
                type="button"
                onClick={() => onStageChange(candidate)}
                disabled={disabled}
                title={title}
                className={
                  'stage-step' +
                  (isCurrent ? ' current' : '') +
                  (isDone ? ' done' : '') +
                  (disabled && !isCurrent ? ' blocked' : '')
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
