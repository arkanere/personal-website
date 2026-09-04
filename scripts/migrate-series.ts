/**
 * Series Migration Script
 *
 * Adds the concept of a "series" to the blog:
 *   - personal_website_series holds the series itself (title, slug, description)
 *   - each series designates one member blog as its index article (index_blog_id),
 *     which is the article that shows up on the home page
 *   - blogs gain series_id / series_order; a blog with series_id = NULL is an
 *     ordinary standalone article and keeps behaving exactly as before
 *
 * To run: npx tsx scripts/migrate-series.ts
 *
 * The migration is additive and safe to run more than once.
 */

import { config } from 'dotenv'
import { sql } from '@vercel/postgres'

// Load environment variables from .env.local
config({ path: '.env.local' })

async function createSeriesTable() {
  console.log('Creating personal_website_series table...')

  await sql`
    CREATE TABLE IF NOT EXISTS personal_website_series (
      id SERIAL PRIMARY KEY,

      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,

      -- The article that represents the series on the home page.
      -- Usually the series' index post, written and edited by hand.
      index_blog_id INTEGER REFERENCES personal_website_blogs(id) ON DELETE SET NULL,

      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_series_slug ON personal_website_series(slug);`

  console.log('✓ Series table created')
}

async function addSeriesColumnsToBlogs() {
  console.log('Adding series columns to personal_website_blogs...')

  // Deleting a series detaches its members rather than deleting them:
  // they simply become independent articles again.
  await sql`
    ALTER TABLE personal_website_blogs
    ADD COLUMN IF NOT EXISTS series_id INTEGER
      REFERENCES personal_website_series(id) ON DELETE SET NULL;
  `

  await sql`
    ALTER TABLE personal_website_blogs
    ADD COLUMN IF NOT EXISTS series_order INTEGER;
  `

  // Fast lookup of "all posts in this series, in reading order"
  await sql`
    CREATE INDEX IF NOT EXISTS idx_blogs_series
    ON personal_website_blogs(series_id, series_order);
  `

  console.log('✓ Blog columns added')
}

async function createTriggers() {
  console.log('Creating triggers...')

  await sql`
    CREATE OR REPLACE FUNCTION update_series_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `

  await sql`DROP TRIGGER IF EXISTS series_updated_at ON personal_website_series;`

  await sql`
    CREATE TRIGGER series_updated_at
    BEFORE UPDATE ON personal_website_series
    FOR EACH ROW EXECUTE FUNCTION update_series_updated_at();
  `

  console.log('✓ Triggers created')
}

async function main() {
  try {
    await createSeriesTable()
    await addSeriesColumnsToBlogs()
    await createTriggers()
    console.log('\n✅ Series migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
