/**
 * Writing Stages Migration
 *
 * An article is written in four stages, and each keeps its own column:
 *
 *   braindump  TEXT    everything as it came, unstructured
 *   keywords   TEXT[]  the concepts pulled out of the dump
 *   twms       JSONB   the twenty-words-max units, in order
 *   content    TEXT    the final format — the column that already existed
 *
 * There is no column recording which stage an article is "at". Stages are
 * places to work, freely moved between, so there is nothing to record.
 *
 * Publishing requires one thing: a non-empty final format.
 *
 * To run: npx tsx scripts/migrate-writing-stages.ts
 *
 * Replaces the earlier stage/workspace migration, and removes its columns.
 * Safe to run more than once.
 */

import { config } from 'dotenv'
import { sql } from '@vercel/postgres'

config({ path: '.env.local' })

async function hasColumn(name: string): Promise<boolean> {
  const { rows } = await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'personal_website_blogs' AND column_name = ${name}
  `
  return rows.length > 0
}

async function addStageColumns() {
  console.log('Adding a column per writing stage...')

  await sql`
    ALTER TABLE personal_website_blogs
    ADD COLUMN IF NOT EXISTS braindump TEXT NOT NULL DEFAULT '';
  `
  await sql`
    ALTER TABLE personal_website_blogs
    ADD COLUMN IF NOT EXISTS keywords TEXT[] NOT NULL DEFAULT '{}';
  `
  await sql`
    ALTER TABLE personal_website_blogs
    ADD COLUMN IF NOT EXISTS twms JSONB NOT NULL DEFAULT '[]'::jsonb;
  `

  console.log('✓ Columns added')
}

async function carryOverWorkspace() {
  if (!(await hasColumn('workspace'))) {
    console.log('- No workspace column to carry over')
    return
  }

  console.log('Carrying over any workspace material...')

  const { rows } = await sql`
    UPDATE personal_website_blogs SET
      braindump = COALESCE(workspace->>'braindump', ''),
      keywords = COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(workspace->'keywords')),
        '{}'
      ),
      twms = COALESCE(workspace->'twms', '[]'::jsonb)
    WHERE workspace IS NOT NULL AND workspace <> '{}'::jsonb
    RETURNING id
  `

  console.log(`✓ Carried over ${rows.length} row(s)`)
}

async function replacePublishGuard() {
  console.log('Replacing the publish guard...')

  // The old guard tied publishing to a stage pointer. The rule is simpler:
  // you publish what is in the final format, so there has to be something in it.
  await sql`
    ALTER TABLE personal_website_blogs
    DROP CONSTRAINT IF EXISTS blogs_publish_requires_final;
  `
  await sql`
    ALTER TABLE personal_website_blogs
    DROP CONSTRAINT IF EXISTS blogs_publish_requires_content;
  `
  await sql`
    ALTER TABLE personal_website_blogs
    ADD CONSTRAINT blogs_publish_requires_content
    CHECK (status <> 'published' OR btrim(content) <> '');
  `

  console.log('✓ Publish guard replaced')
}

async function dropStagePointer() {
  console.log('Dropping the stage pointer...')

  await sql`
    ALTER TABLE personal_website_blogs
    DROP CONSTRAINT IF EXISTS blogs_stage_check;
  `
  await sql`DROP INDEX IF EXISTS idx_blogs_stage;`
  await sql`ALTER TABLE personal_website_blogs DROP COLUMN IF EXISTS stage;`
  await sql`ALTER TABLE personal_website_blogs DROP COLUMN IF EXISTS workspace;`

  console.log('✓ Stage pointer dropped')
}

async function report() {
  const { rows } = await sql`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE btrim(braindump) <> '')::int AS with_dump,
           COUNT(*) FILTER (WHERE array_length(keywords, 1) > 0)::int AS with_keywords,
           COUNT(*) FILTER (WHERE jsonb_array_length(twms) > 0)::int AS with_twms,
           COUNT(*) FILTER (WHERE btrim(content) <> '')::int AS with_content
    FROM personal_website_blogs
  `
  console.log('\nArticles:', rows[0])
}

async function main() {
  try {
    await addStageColumns()
    await carryOverWorkspace()
    await replacePublishGuard()
    await dropStagePointer()
    await report()
    console.log('\n✅ Writing stages migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
