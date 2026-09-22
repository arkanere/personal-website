/**
 * Admin Whitelist Check
 *
 * The whitelist is the only thing standing between a Google account and the
 * admin API, so it is asserted directly. No database, no server, no OAuth
 * round trip needed.
 *
 * To run: npx tsx scripts/check-auth.ts
 */

import assert from 'node:assert/strict'
import { isAdminEmail } from '@/lib/auth'

function withList<T>(value: string | undefined, run: () => T): T {
  const previous = process.env.ADMIN_EMAILS
  if (value === undefined) delete process.env.ADMIN_EMAILS
  else process.env.ADMIN_EMAILS = value
  try {
    return run()
  } finally {
    if (previous === undefined) delete process.env.ADMIN_EMAILS
    else process.env.ADMIN_EMAILS = previous
  }
}

// An unconfigured list admits nobody. This is the important one: it used to
// return true and hand admin to every Google account on earth.
withList(undefined, () => {
  assert.equal(isAdminEmail('anyone@example.com'), false)
})
withList('', () => {
  assert.equal(isAdminEmail('anyone@example.com'), false)
})
withList('   ,  , ', () => {
  assert.equal(isAdminEmail('anyone@example.com'), false)
})

// A missing address is never on the list
withList('me@example.com', () => {
  assert.equal(isAdminEmail(undefined), false)
  assert.equal(isAdminEmail(null), false)
  assert.equal(isAdminEmail(''), false)
})

// The ordinary case, plus the whitespace a hand-edited env var collects
withList(' me@example.com , you@example.com ', () => {
  assert.equal(isAdminEmail('me@example.com'), true)
  assert.equal(isAdminEmail('you@example.com'), true)
  assert.equal(isAdminEmail('them@example.com'), false)
})

// Addresses are compared case-insensitively, on both sides
withList('Me@Example.COM', () => {
  assert.equal(isAdminEmail('me@example.com'), true)
  assert.equal(isAdminEmail('ME@EXAMPLE.COM'), true)
})

// No partial or substring matching: the address must be the whole entry
withList('me@example.com', () => {
  assert.equal(isAdminEmail('me@example.com.evil.com'), false)
  assert.equal(isAdminEmail('notme@example.com'), false)
  assert.equal(isAdminEmail('me@example.co'), false)
  assert.equal(isAdminEmail('me@example.com '), false)
})

console.log('✓ all admin whitelist assertions passed')
