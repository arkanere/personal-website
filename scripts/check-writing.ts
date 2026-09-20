/**
 * Lifecycle Rule Check
 *
 * The lifecycle rules are small but load-bearing: the 20-word ceiling, the
 * stage gates, and the publish guard are what the UI and the API both lean on.
 * This asserts them directly, with no database and no server needed.
 *
 * To run: npx tsx scripts/check-writing.ts
 */

import assert from 'node:assert/strict'
import {
  countWords, validateTwm, canPublish, composeDraft,
  normalizeTwms, normalizeDraftKeywords, TWM_MAX_WORDS,
} from '@/lib/lifecycle'

// countWords matches twm's CLI behaviour, but returns 0 for empty
assert.equal(countWords(''), 0)
assert.equal(countWords('   '), 0)
assert.equal(countWords('one  two\nthree'), 3)

// the 20-word ceiling. An empty twm is allowed: a half-written row is normal
// while working, and only the composed result has to amount to anything.
const twenty = Array(20).fill('w').join(' ')
assert.equal(validateTwm(twenty), null)
assert.match(validateTwm(twenty + ' w')!, /at most 20 words \(this one has 21\)/)
assert.equal(validateTwm('  '), null)
assert.equal(TWM_MAX_WORDS, 20)

// normalizers survive junk, which is the whole reason they exist
assert.deepEqual(normalizeDraftKeywords(undefined), [])
assert.deepEqual(normalizeDraftKeywords('nonsense'), [])
assert.deepEqual(normalizeDraftKeywords(['a', '', '  b  ', 7]), ['a', 'b'])
assert.deepEqual(normalizeTwms(undefined), [])
assert.deepEqual(normalizeTwms([{ text: 'x' }, null]), [{ id: 'twm-1', seed: null, text: 'x' }])

// publishing needs a non-empty final format, and nothing else.
// An editor's empty is not an empty string, which is what let a blank article
// be published: TipTap leaves a bare paragraph behind.
assert.equal(canPublish(''), false)
assert.equal(canPublish('   '), false)
assert.equal(canPublish('<p></p>'), false)
assert.equal(canPublish('<p><br></p>'), false)
assert.equal(canPublish('<p>&nbsp;</p>'), false)
assert.equal(canPublish('<p> </p>\n<p></p>'), false)
assert.equal(canPublish('<p>x</p>'), true)
// media strips to nothing but is still an article
assert.equal(canPublish('<p><img src="a.png"></p>'), true)
// a series index stands for its series on the home page and may be blank
assert.equal(canPublish('<p></p>', { isSeriesIndex: true }), true)
assert.equal(canPublish('<p></p>', { isSeriesIndex: false }), false)

// composeDraft: 4 twms per paragraph, html-escaped
assert.equal(composeDraft([]), '')
const five = [1, 2, 3, 4, 5].map(n => ({ id: `t${n}`, seed: null, text: `s${n}.` }))
assert.equal(composeDraft(five), '<p>s1. s2. s3. s4.</p>\n<p>s5.</p>')
assert.equal(composeDraft([{ id: 't', seed: null, text: 'a < b & c' }]), '<p>a &lt; b &amp; c</p>')
assert.equal(composeDraft([{ id: 't', seed: null, text: '   ' }]), '')

console.log('✓ all writing rule assertions passed')
