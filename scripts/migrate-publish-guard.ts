/**
 * Publish Guard Fix
 *
 * The guard was btrim(content) <> '', which let a blank article through: an
 * editor's empty is not an empty string, and TipTap leaves "<p></p>" behind.
 *
 * The rule now lives in the application alone. It has to: a series index
 * article stands for its series on the home page and is legitimately blank,
 * and a CHECK constraint cannot see the series table to know that.
 *
 * To run: npx tsx scripts/migrate-publish-guard.ts
 *
 * Safe to run more than once.
 */

import { config } from 'dotenv'
import { sql } from '@vercel/postgres'

config({ path: '.env.local' })

async function main() {
  try {
    await sql`
      ALTER TABLE personal_website_blogs
      DROP CONSTRAINT IF EXISTS blogs_publish_requires_content;
    `

    const { rows } = await sql`
      SELECT b.id, b.title, (s.index_blog_id = b.id) AS is_index
      FROM personal_website_blogs b
      LEFT JOIN personal_website_series s ON b.series_id = s.id
      WHERE b.status = 'published'
        AND b.content !~* '<(img|iframe|video|audio)'
        AND btrim(regexp_replace(
              regexp_replace(b.content, '<[^>]*>', '', 'g'),
              '&nbsp;|&#160;', ' ', 'gi')) = ''
      ORDER BY b.id
    `

    console.log('✅ Publish guard constraint dropped; the rule is enforced in the app')
    console.log('\nPublished articles that are blank:')
    if (rows.length === 0) {
      console.log('  none')
    } else {
      rows.forEach(r =>
        console.log(`  #${r.id} ${r.title}${r.is_index ? ' (series index — allowed)' : ' (NOT an index)'}`)
      )
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
