/**
 * Lifecycle Rule Check
 *
 * The lifecycle rules are small but load-bearing: the 20-word ceiling, the
 * stage gates, and the publish guard are what the UI and the API both lean on.
 * This asserts them directly, with no database and no server needed.
 *
 * To run: npx tsx scripts/check-lifecycle.ts
 */

import assert from 'node:assert/strict'
import {
  countWords, normalizeWorkspace, validateTwm, stageEntryBlocker,
  publishBlocker, composeDraft, emptyWorkspace, TWM_MAX_WORDS,
} from '@/lib/lifecycle'

// countWords matches twm's CLI behaviour, but returns 0 for empty
assert.equal(countWords(''), 0)
assert.equal(countWords('   '), 0)
assert.equal(countWords('one  two\nthree'), 3)

// the 20-word ceiling
const twenty = Array(20).fill('w').join(' ')
assert.equal(validateTwm(twenty), null)
assert.match(validateTwm(twenty + ' w')!, /at most 20 words \(this one has 21\)/)
assert.match(validateTwm('  ')!, /cannot be empty/)
assert.equal(TWM_MAX_WORDS, 20)

// normalizeWorkspace survives junk, which is the whole reason it exists
assert.deepEqual(normalizeWorkspace(undefined), emptyWorkspace())
assert.deepEqual(normalizeWorkspace({}), emptyWorkspace())
assert.deepEqual(normalizeWorkspace('nonsense'), emptyWorkspace())
assert.deepEqual(
  normalizeWorkspace({ keywords: ['a', '', '  b  ', 7], twms: [{ text: 'x' }, null] }),
  { braindump: '', keywords: ['a', 'b'], twms: [{ id: 'twm-1', seed: null, text: 'x' }] }
)

// stage gating: entry is gated, going back is always allowed
const ws = emptyWorkspace()
assert.equal(stageEntryBlocker(ws, 'braindump'), null)
assert.match(stageEntryBlocker(ws, 'keywords')!, /brain dump/)
assert.match(stageEntryBlocker(ws, 'twm')!, /keyword/)
assert.match(stageEntryBlocker(ws, 'final')!, /twm/)

const dumped = { ...ws, braindump: 'some thoughts' }
assert.equal(stageEntryBlocker(dumped, 'keywords'), null)
const keyed = { ...dumped, keywords: ['focus'] }
assert.equal(stageEntryBlocker(keyed, 'twm'), null)
const twmed = { ...keyed, twms: [{ id: 't1', seed: 'focus', text: 'Every unrequired word burdens the mind.' }] }
assert.equal(stageEntryBlocker(twmed, 'final'), null)

// An article with content can always return to Final, whatever its workspace.
// Every article written before the lifecycle existed looks like this: content,
// no twms. Gating Final on twms alone stranded them away from their own text.
const legacy = emptyWorkspace()
assert.match(stageEntryBlocker(legacy, 'final')!, /at least one twm/)
assert.equal(stageEntryBlocker(legacy, 'final', { hasContent: true }), null)
assert.equal(stageEntryBlocker(legacy, 'final', { hasContent: false }) !== null, true)
// hasContent does not unlock the earlier gates, which are about material
assert.match(stageEntryBlocker(legacy, 'keywords', { hasContent: true })!, /brain dump/)
assert.match(stageEntryBlocker(legacy, 'twm', { hasContent: true })!, /keyword/)

// publishing is gated on stage, not status
assert.match(publishBlocker({ stage: 'twm', content: 'x' })!, /Only a final article/)
assert.match(publishBlocker({ stage: 'final', content: '   ' })!, /needs content/)
assert.equal(publishBlocker({ stage: 'final', content: '<p>x</p>' }), null)

// composeDraft: 4 twms per paragraph, html-escaped
assert.equal(composeDraft([]), '')
const five = [1, 2, 3, 4, 5].map(n => ({ id: `t${n}`, seed: null, text: `s${n}.` }))
assert.equal(composeDraft(five), '<p>s1. s2. s3. s4.</p>\n<p>s5.</p>')
assert.equal(composeDraft([{ id: 't', seed: null, text: 'a < b & c' }]), '<p>a &lt; b &amp; c</p>')
assert.equal(composeDraft([{ id: 't', seed: null, text: '   ' }]), '')

console.log('✓ all lifecycle assertions passed')
