'use client'

/**
 * Sits behind the brain dump textarea carrying the same text, invisible except
 * for a <mark> on every draft keyword. The textarea above it is transparent, so
 * what the writer sees is their own text lit up wherever a keyword lands. The
 * highlights are derived from the keyword list, never stored: add a keyword and
 * it lights up here, remove it and the light goes out.
 */

import { forwardRef, ReactNode } from 'react'
import { findKeywordMatches } from '@/lib/lifecycle'

interface BrainDumpHighlightsProps {
  text: string
  keywords: string[]
}

const BrainDumpHighlights = forwardRef<HTMLDivElement, BrainDumpHighlightsProps>(
  function BrainDumpHighlights({ text, keywords }, ref) {
    const parts: ReactNode[] = []
    let at = 0

    findKeywordMatches(text, keywords).forEach((match, i) => {
      if (match.start > at) parts.push(text.slice(at, match.start))
      parts.push(
        <mark key={i} className="braindump-mark">
          {text.slice(match.start, match.end)}
        </mark>
      )
      at = match.end
    })

    // A trailing newline makes no line of its own here, so without this the
    // mirror would come up one line short of the textarea and the two would
    // scroll out of step.
    parts.push(text.slice(at) + '\n')

    return (
      <div ref={ref} className="braindump-highlights" aria-hidden="true">
        {parts}
      </div>
    )
  }
)

export default BrainDumpHighlights
