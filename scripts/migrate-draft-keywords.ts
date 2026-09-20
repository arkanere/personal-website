/**
 * Draft Keywords Rename
 *
 * There are two kinds of keyword on an article and they are not the same
 * thing: the SEO keywords, which are metadata for search engines and live in
 * seo_metadata, and the draft keywords, which are the concepts pulled out of
 * a brain dump on the way to writing twms.
 *
 * The writing-stage column was called "keywords", which invited exactly that
 * confusion. It is now draft_keywords.
 *
 * To run: npx tsx scripts/migrate-draft-keywords.ts
 *
 * Safe to run more than once. Nothing in seo_metadata is touched.
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

async function main() {
  try {
    if (await hasColumn('draft_keywords')) {
      console.log('- draft_keywords already exists, nothing to do')
    } else if (await hasColumn('keywords')) {
      await sql`
        ALTER TABLE personal_website_blogs
        RENAME COLUMN keywords TO draft_keywords;
      `
      console.log('✓ Renamed keywords -> draft_keywords')
    } else {
      await sql`
        ALTER TABLE personal_website_blogs
        ADD COLUMN draft_keywords TEXT[] NOT NULL DEFAULT '{}';
      `
      console.log('✓ Created draft_keywords')
    }

    const { rows } = await sql`
      SELECT COUNT(*) FILTER (WHERE array_length(draft_keywords, 1) > 0)::int AS with_draft,
             COUNT(*) FILTER (WHERE btrim(COALESCE(seo_metadata->>'keywords','')) <> '')::int AS with_seo
      FROM personal_website_blogs
    `
    console.log('\nArticles with draft keywords:', rows[0].with_draft)
    console.log('Articles with SEO keywords:  ', rows[0].with_seo, '(untouched)')
    console.log('\n✅ Done')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
