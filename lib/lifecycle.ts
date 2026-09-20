/**
 * Article Lifecycle
 *
 * An article is written in four stages: a brain dump, the keywords pulled out
 * of it, the twms (twenty-words-max units) seeded by those keywords, and the
 * final composed piece. Only the final stage can be published.
 *
 * Stage is deliberately separate from status. Status answers "who can see
 * this"; stage answers "how far along is it". Collapsing the two is what makes
 * a one-line idea and a finished-but-unpublished essay both look like drafts.
 */

import { BlogStage, Twm, Workspace } from '@/lib/types/blog'

export const STAGES: BlogStage[] = ['braindump', 'keywords', 'twm', 'final']

export const STAGE_LABELS: Record<BlogStage, string> = {
  braindump: 'Brain Dump',
  keywords: 'Keywords',
  twm: '20 Words Max',
  final: 'Final',
}

/**
 * The whole point of the primitive: a twm is the smallest unit of complete
 * meaning, and the ceiling is what forces it to be one.
 */
export const TWM_MAX_WORDS = 20

export function isBlogStage(value: unknown): value is BlogStage {
  return typeof value === 'string' && (STAGES as string[]).includes(value)
}

export function stageIndex(stage: BlogStage): number {
  return STAGES.indexOf(stage)
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (trimmed === '') return 0
  return trimmed.split(/\s+/).length
}

export function emptyWorkspace(): Workspace {
  return { braindump: '', keywords: [], twms: [] }
}

/**
 * Workspaces are stored as JSONB and are edited by hand as often as not, so
 * every read goes through here rather than trusting the shape on the way in.
 */
export function normalizeWorkspace(raw: unknown): Workspace {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const braindump = typeof source.braindump === 'string' ? source.braindump : ''

  const keywords = Array.isArray(source.keywords)
    ? source.keywords
        .filter((k): k is string => typeof k === 'string')
        .map(k => k.trim())
        .filter(k => k !== '')
    : []

  const twms = Array.isArray(source.twms)
    ? source.twms
        .filter((t): t is Record<string, unknown> => Boolean(t) && typeof t === 'object')
        .map((t, i) => ({
          id: typeof t.id === 'string' && t.id !== '' ? t.id : `twm-${i + 1}`,
          seed: typeof t.seed === 'string' && t.seed.trim() !== '' ? t.seed.trim() : null,
          text: typeof t.text === 'string' ? t.text : '',
        }))
    : []

  return { braindump, keywords, twms }
}

/** Returns an error message, or null when the twm is within its budget. */
export function validateTwm(text: string): string | null {
  const words = countWords(text)
  if (words === 0) return 'A twm cannot be empty'
  if (words > TWM_MAX_WORDS) {
    return `A twm is at most ${TWM_MAX_WORDS} words (this one has ${words})`
  }
  return null
}

export function newTwmId(): string {
  return `twm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Stages are places to work, not a pipeline with turnstiles. You can move to
 * any of them at any time, in any order — writing does not proceed in one
 * direction, and an editor that insists it does is just in the way.
 *
 * Nothing is lost by moving: each stage keeps its own material, and the
 * written content stays on the final stage whatever else happens.
 */

/** Why an article cannot be published yet, or null when it can. */
export function publishBlocker(blog: { stage: BlogStage; content: string }): string | null {
  if (blog.stage !== 'final') {
    return `Only a final article can be published (this one is at "${STAGE_LABELS[blog.stage]}")`
  }
  if (blog.content.trim() === '') return 'An article needs content before it can be published'
  return null
}

export function canPublish(blog: { stage: BlogStage; content: string }): boolean {
  return publishBlocker(blog) === null
}

/** 3-5 twms make a paragraph, per the twm architecture. */
const TWMS_PER_PARAGRAPH = 4

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Compose the twms into the HTML the editor expects. This is the hinge of the
 * whole lifecycle: the point where a workspace becomes a draft article.
 */
export function composeDraft(twms: Twm[]): string {
  const texts = twms.map(t => t.text.trim()).filter(t => t !== '')
  if (texts.length === 0) return ''

  const paragraphs: string[] = []
  for (let i = 0; i < texts.length; i += TWMS_PER_PARAGRAPH) {
    paragraphs.push(texts.slice(i, i + TWMS_PER_PARAGRAPH).join(' '))
  }

  return paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n')
}
