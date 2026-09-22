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

/** Case-insensitive; returns the array untouched when the keyword is blank or already there. */
export function addDraftKeyword(keywords: string[], raw: string): string[] {
  const keyword = raw.trim().replace(/\s+/g, ' ')
  if (keyword === '') return keywords
  if (keywords.some(k => k.toLowerCase() === keyword.toLowerCase())) return keywords
  return [...keywords, keyword]
}

export interface KeywordMatch {
  start: number
  end: number
}

/**
 * Where every keyword sits in the brain dump. Longer keywords are placed first,
 * so a phrase is marked once rather than as its separate words, and a match is
 * dropped when it overlaps one already placed.
 */
export function findKeywordMatches(text: string, keywords: string[]): KeywordMatch[] {
  const matches: KeywordMatch[] = []
  const taken = new Array<boolean>(text.length).fill(false)

  for (const keyword of [...keywords].sort((a, b) => b.length - a.length)) {
    if (keyword.trim() === '') continue

    // Whole words only, so "art" does not light up inside "start". A keyword
    // typed with one space still matches text that wrapped across a newline.
    const pattern = keyword
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s+')
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`, 'giu')

    let match: RegExpExecArray | null
    while ((match = re.exec(text)) !== null) {
      const start = match.index
      const end = start + match[0].length
      if (end === start) {
        re.lastIndex++
        continue
      }
      let free = true
      for (let i = start; i < end; i++) {
        if (taken[i]) {
          free = false
          break
        }
      }
      if (!free) continue
      for (let i = start; i < end; i++) taken[i] = true
      matches.push({ start, end })
    }
  }

  return matches.sort((a, b) => a.start - b.start)
}
