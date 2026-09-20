/**
 * Writing stages: brain dump, draft keywords, twms, final format. Each keeps
 * its own field on the article; nothing records which stage an article is at.
 */

import { Twm } from '@/lib/types/blog'

export const TWM_MAX_WORDS = 20

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (trimmed === '') return 0
  return trimmed.split(/\s+/).length
}

/** Returns an error message, or null when valid. */
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

/** Draft keywords, not the SEO keywords in seo_metadata. */
export function normalizeDraftKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter((k): k is string => typeof k === 'string')
    .map(k => k.trim())
    .filter(k => k !== '')
}

/**
 * TipTap leaves "<p></p>" behind, so emptiness is judged after stripping
 * markup. Embedded media counts as content even though it strips to nothing.
 */
const EMBED = /<(img|iframe|video|audio)\b/i

export function isBlank(html: string): boolean {
  if (EMBED.test(html)) return false
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .trim() === ''
}

/** Series index articles are exempt: they are deliberately blank. */
export function canPublish(
  content: string,
  options: { isSeriesIndex?: boolean } = {}
): boolean {
  if (options.isSeriesIndex) return true
  return !isBlank(content)
}

const TWMS_PER_PARAGRAPH = 4

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function composeDraft(twms: Twm[]): string {
  const texts = twms.map(t => t.text.trim()).filter(t => t !== '')
  if (texts.length === 0) return ''

  const paragraphs: string[] = []
  for (let i = 0; i < texts.length; i += TWMS_PER_PARAGRAPH) {
    paragraphs.push(texts.slice(i, i + TWMS_PER_PARAGRAPH).join(' '))
  }

  return paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n')
}
