/**
 * Writing Stages
 *
 * An article is written in four stages — a brain dump, the keywords pulled out
 * of it, the twms built from those keywords, and the final format — and each
 * keeps its own field on the article.
 *
 * Nothing records which stage an article is "at". They are places to work,
 * moved between freely, so there is nothing to record.
 *
 * Publishing has one requirement: a non-empty final format.
 */

import { Twm } from '@/lib/types/blog'

/** The whole point of the primitive: a twm is at most twenty words. */
export const TWM_MAX_WORDS = 20

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (trimmed === '') return 0
  return trimmed.split(/\s+/).length
}

/** Returns an error message, or null when the twm is within its budget. */
export function validateTwm(text: string): string | null {
  const words = countWords(text)
  if (words > TWM_MAX_WORDS) {
    return `A twm is at most ${TWM_MAX_WORDS} words (this one has ${words})`
  }
  return null
}

export function newTwmId(): string {
  return `twm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Twms are stored as JSONB, so every read goes through here. */
export function normalizeTwms(raw: unknown): Twm[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter((t): t is Record<string, unknown> => Boolean(t) && typeof t === 'object')
    .map((t, i) => ({
      id: typeof t.id === 'string' && t.id !== '' ? t.id : `twm-${i + 1}`,
      seed: typeof t.seed === 'string' && t.seed.trim() !== '' ? t.seed.trim() : null,
      text: typeof t.text === 'string' ? t.text : '',
    }))
}

export function normalizeKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter((k): k is string => typeof k === 'string')
    .map(k => k.trim())
    .filter(k => k !== '')
}

/**
 * An editor's idea of empty is not an empty string: TipTap leaves "<p></p>"
 * behind, so emptiness has to be judged after the markup is stripped. Embedded
 * media counts as content even though it strips to nothing.
 */
const EMBED = /<(img|iframe|video|audio)\b/i

export function isBlank(html: string): boolean {
  if (EMBED.test(html)) return false
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .trim() === ''
}

/**
 * You publish what is in the final format, so there has to be something in it.
 *
 * A series index article is the exception: it exists to stand for its series on
 * the home page, and several are deliberately blank.
 */
export function canPublish(
  content: string,
  options: { isSeriesIndex?: boolean } = {}
): boolean {
  if (options.isSeriesIndex) return true
  return !isBlank(content)
}

/** 3-5 twms make a paragraph, per the twm architecture. */
const TWMS_PER_PARAGRAPH = 4

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Compose the twms into the final format. */
export function composeDraft(twms: Twm[]): string {
  const texts = twms.map(t => t.text.trim()).filter(t => t !== '')
  if (texts.length === 0) return ''

  const paragraphs: string[] = []
  for (let i = 0; i < texts.length; i += TWMS_PER_PARAGRAPH) {
    paragraphs.push(texts.slice(i, i + TWMS_PER_PARAGRAPH).join(' '))
  }

  return paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n')
}
