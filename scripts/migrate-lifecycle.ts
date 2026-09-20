/**
 * Article Lifecycle Migration
 *
 * Adds the writing lifecycle to the blog:
 *   - stage records how far along an article is (braindump → keywords → twm →
 *     final), separately from status, which records who can see it
 *   - workspace holds the pre-final material: the dump, the keywords pulled
 *     out of it, and the twms built from those keywords
 *
 * To run:     npx tsx scripts/migrate-lifecycle.ts
 * To undo:    npx tsx scripts/rollback-lifecycle.ts
 *
 * The migration is additive and safe to run more than once. Every existing
 * article defaults to stage 'final', so nothing about the current site changes
 * until an article is deliberately moved back.
 */

import { config } from 'dotenv'
import { sql } from '@vercel/postgres'

config({ path: '.env.local' })

async function addLifecycleColumns() {
  console.log('Adding lifecycle columns to personal_website_blogs...')

  // Existing articles are, by definition, already written: they start at
  // 'final' so the admin list and the public site look exactly as before.
  await sql`
    ALTER TABLE personal_website_blogs
    ADD COLUMN IF NOT EXISTS stage VARCHAR(20) NOT NULL DEFAULT 'final';
  `

  await sql`
    ALTER TABLE personal_website_blogs
    ADD COLUMN IF NOT EXISTS workspace JSONB NOT NULL DEFAULT '{}'::jsonb;
  `

  console.log('✓ Columns added')
}

async function addStageConstraint() {
  console.log('Adding stage check constraint...')

  // ADD CONSTRAINT has no IF NOT EXISTS, so drop first to stay re-runnable.
  await sql`
    ALTER TABLE personal_website_blogs
    DROP CONSTRAINT IF EXISTS blogs_stage_check;
  `

  await sql`
    ALTER TABLE personal_website_blogs
    ADD CONSTRAINT blogs_stage_check
    CHECK (stage IN ('braindump', 'keywords', 'twm', 'final'));
  `

  console.log('✓ Constraint added')
}

async function addPublishGuard() {
  console.log('Adding publish guard constraint...')

  // The rule that connects stage to status, enforced where it cannot be
  // bypassed: an unfinished article can never be published, whatever the
  // application layer does.
  await sql`
    ALTER TABLE personal_website_blogs
    DROP CONSTRAINT IF EXISTS blogs_publish_requires_final;
  `

  await sql`
    ALTER TABLE personal_website_blogs
    ADD CONSTRAINT blogs_publish_requires_final
    CHECK (status <> 'published' OR stage = 'final');
  `

  console.log('✓ Publish guard added')
}

async function addStageIndex() {
  console.log('Creating stage index...')

  await sql`
    CREATE INDEX IF NOT EXISTS idx_blogs_stage
    ON personal_website_blogs(stage);
  `

  console.log('✓ Index created')
}

async function report() {
  const { rows } = await sql`
    SELECT stage, status, COUNT(*)::int AS count
    FROM personal_website_blogs
    GROUP BY stage, status
    ORDER BY stage, status
  `
  console.log('\nCurrent distribution:')
  rows.forEach(r => console.log(`  ${r.stage.padEnd(10)} ${r.status.padEnd(10)} ${r.count}`))
}

async function main() {
  try {
    await addLifecycleColumns()
    await addStageConstraint()
    await addPublishGuard()
    await addStageIndex()
    await report()
    console.log('\n✅ Lifecycle migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
