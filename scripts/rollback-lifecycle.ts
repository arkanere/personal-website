/**
 * Article Lifecycle Rollback
 *
 * Undoes scripts/migrate-lifecycle.ts, returning the blogs table to exactly
 * the shape it had before. Nothing outside the two added columns is touched,
 * so no article, series or publication state is affected.
 *
 * To run: npx tsx scripts/rollback-lifecycle.ts -- --yes
 *
 * This DOES discard any workspace material (brain dumps, keywords, twms)
 * written since the migration, so it asks for --yes before doing anything.
 */

import { config } from 'dotenv'
import { sql } from '@vercel/postgres'

config({ path: '.env.local' })

async function main() {
  if (!process.argv.includes('--yes')) {
    const { rows } = await sql`
      SELECT COUNT(*)::int AS count
      FROM personal_website_blogs
      WHERE workspace <> '{}'::jsonb
    `
    console.log(
      `This will drop the stage and workspace columns.\n` +
      `${rows[0].count} article(s) currently hold workspace material, which would be lost.\n` +
      `Re-run with --yes to proceed.`
    )
    process.exit(1)
  }

  try {
    await sql`ALTER TABLE personal_website_blogs DROP CONSTRAINT IF EXISTS blogs_publish_requires_final;`
    await sql`ALTER TABLE personal_website_blogs DROP CONSTRAINT IF EXISTS blogs_stage_check;`
    await sql`DROP INDEX IF EXISTS idx_blogs_stage;`
    await sql`ALTER TABLE personal_website_blogs DROP COLUMN IF EXISTS workspace;`
    await sql`ALTER TABLE personal_website_blogs DROP COLUMN IF EXISTS stage;`
    console.log('✅ Lifecycle rollback completed.')
  } catch (error) {
    console.error('❌ Rollback failed:', error)
    process.exit(1)
  }
}

main()
