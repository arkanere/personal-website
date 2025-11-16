/**
 * Database Migration Script
 *
 * This script creates the personal_website_blogs table in your Vercel Postgres database.
 * Based on the reference implementation with full-text search and advanced indexing.
 *
 * To run: npx tsx scripts/migrate-db.ts
 *
 * Prerequisites:
 * 1. Install tsx: npm install -D tsx (already installed)
 * 2. Set up POSTGRES_URL in .env.local
 */

import { config } from 'dotenv'
import { sql } from '@vercel/postgres'

// Load environment variables from .env.local
config({ path: '.env.local' })

async function createBlogsTable() {
  try {
    console.log('Creating personal_website_blogs table...')

    await sql`
      CREATE TABLE IF NOT EXISTS personal_website_blogs (
        -- Primary key
        id SERIAL PRIMARY KEY,

        -- Core content fields (structured, required)
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,

        -- JSONB fields for flexible data
        featured_image JSONB,
        seo_metadata JSONB DEFAULT '{}',
        custom_fields JSONB DEFAULT '{}',

        -- Arrays for tags and categories
        tags TEXT[] DEFAULT '{}',
        categories TEXT[] DEFAULT '{}',

        -- Author information
        author_name VARCHAR(255) NOT NULL,

        -- Status and publication tracking
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        -- Analytics
        view_count INTEGER DEFAULT 0,

        -- Full-text search vector (auto-maintained by trigger)
        search_vector tsvector
      );
    `

    console.log('✓ Table created successfully')

    // Create indexes for better query performance
    console.log('Creating performance indexes...')

    // Composite index for published blogs (most common query)
    await sql`CREATE INDEX IF NOT EXISTS idx_blogs_published ON personal_website_blogs(status, published_at DESC);`

    // Index for slug lookups
    await sql`CREATE INDEX IF NOT EXISTS idx_blogs_slug ON personal_website_blogs(slug);`

    // GIN indexes for array fields (enables fast array containment queries)
    await sql`CREATE INDEX IF NOT EXISTS idx_blogs_tags ON personal_website_blogs USING GIN(tags);`
    await sql`CREATE INDEX IF NOT EXISTS idx_blogs_categories ON personal_website_blogs USING GIN(categories);`

    // GIN indexes for JSONB fields (enables fast JSON queries)
    await sql`CREATE INDEX IF NOT EXISTS idx_blogs_custom_fields ON personal_website_blogs USING GIN(custom_fields);`
    await sql`CREATE INDEX IF NOT EXISTS idx_blogs_seo_metadata ON personal_website_blogs USING GIN(seo_metadata);`

    // GIN index for full-text search
    await sql`CREATE INDEX IF NOT EXISTS idx_blogs_search ON personal_website_blogs USING GIN(search_vector);`

    console.log('✓ Indexes created successfully')

    // Create triggers
    console.log('Creating triggers...')

    // Trigger to auto-update search_vector when blog content changes
    await sql`
      DROP TRIGGER IF EXISTS blogs_search_update ON personal_website_blogs;
    `

    await sql`
      CREATE TRIGGER blogs_search_update
      BEFORE INSERT OR UPDATE ON personal_website_blogs
      FOR EACH ROW EXECUTE FUNCTION
      tsvector_update_trigger(
        search_vector,
        'pg_catalog.english',
        title,
        excerpt,
        content
      );
    `

    // Function to auto-update updated_at timestamp
    await sql`
      CREATE OR REPLACE FUNCTION update_blogs_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    await sql`
      DROP TRIGGER IF EXISTS blogs_updated_at ON personal_website_blogs;
    `

    await sql`
      CREATE TRIGGER blogs_updated_at
      BEFORE UPDATE ON personal_website_blogs
      FOR EACH ROW EXECUTE FUNCTION update_blogs_updated_at();
    `

    console.log('✓ Triggers created successfully')
    console.log('\n✅ Database migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

async function seedSampleData() {
  try {
    console.log('\nSeeding sample data...')

    // Check if any blogs exist
    const { rows } = await sql`SELECT COUNT(*) FROM personal_website_blogs;`
    const count = parseInt(rows[0].count)

    if (count > 0) {
      console.log(`⚠️  Database already has ${count} blog(s). Skipping seed.`)
      return
    }

    // Sample blog posts with full metadata
    const sampleBlogs = [
      {
        title: 'Getting Started with Next.js 15',
        slug: 'getting-started-with-nextjs',
        content: '<h2>Introduction to Next.js 15</h2><p>Next.js 15 brings exciting new features for building modern web applications with React. In this post, we\'ll explore the latest enhancements and how to get started.</p><h3>Key Features</h3><ul><li>Improved performance with enhanced caching</li><li>Better developer experience with updated tooling</li><li>Seamless integration with React Server Components</li></ul>',
        excerpt: 'Learn how to build modern web applications with Next.js 15 and React Server Components.',
        featured_image: {
          url: 'https://via.placeholder.com/1200x630',
          alt: 'Next.js 15 cover image',
          width: 1200,
          height: 630
        },
        author_name: 'Aniruddha Kanere',
        status: 'published',
        tags: ['nextjs', 'react', 'web development'],
        categories: ['Technology', 'Web Development'],
        seo_metadata: {
          metaTitle: 'Getting Started with Next.js 15 - A Complete Guide',
          metaDescription: 'Learn how to build modern web applications with Next.js 15 and React Server Components.',
          keywords: 'nextjs, react, web development, server components'
        },
        published_at: new Date('2024-11-10')
      },
      {
        title: 'Building Scalable APIs',
        slug: 'building-scalable-apis',
        content: '<h2>Best Practices for API Development</h2><p>Creating robust and scalable APIs is crucial for modern applications. Here\'s what you need to know.</p><h3>Essential Principles</h3><ul><li>RESTful design patterns</li><li>Proper error handling</li><li>Rate limiting and security</li><li>Documentation with OpenAPI</li></ul>',
        excerpt: 'Best practices and patterns for building robust, scalable REST APIs.',
        featured_image: null,
        author_name: 'Aniruddha Kanere',
        status: 'published',
        tags: ['api', 'backend', 'rest'],
        categories: ['Technology', 'Backend Development'],
        seo_metadata: {
          metaTitle: 'Building Scalable APIs - Best Practices Guide',
          metaDescription: 'Best practices and patterns for building robust, scalable REST APIs.',
          keywords: 'api, rest, backend, scalability, best practices'
        },
        published_at: new Date('2024-11-05')
      },
      {
        title: 'The Future of Web Development',
        slug: 'future-of-web-development',
        content: '<h2>Emerging Trends in Web Development</h2><p>The web development landscape is constantly evolving. Let\'s look at what\'s coming next.</p><h3>Trends to Watch</h3><ul><li>Edge computing and serverless</li><li>AI-powered development tools</li><li>WebAssembly adoption</li><li>Progressive Web Apps</li></ul>',
        excerpt: 'Exploring upcoming trends and technologies shaping the future of web development.',
        featured_image: null,
        author_name: 'Aniruddha Kanere',
        status: 'draft',
        tags: ['web development', 'trends', 'future'],
        categories: ['Technology', 'Trends'],
        seo_metadata: {
          metaTitle: 'The Future of Web Development - Emerging Trends',
          metaDescription: 'Exploring upcoming trends and technologies shaping the future of web development.',
          keywords: 'web development, trends, edge computing, wasm, pwa'
        },
        published_at: null
      }
    ]

    for (const blog of sampleBlogs) {
      await sql`
        INSERT INTO personal_website_blogs (
          title, slug, content, excerpt, featured_image, author_name, status,
          tags, categories, seo_metadata, published_at
        ) VALUES (
          ${blog.title},
          ${blog.slug},
          ${blog.content},
          ${blog.excerpt},
          ${blog.featured_image ? JSON.stringify(blog.featured_image) : null}::jsonb,
          ${blog.author_name},
          ${blog.status},
          ${blog.tags},
          ${blog.categories},
          ${JSON.stringify(blog.seo_metadata)}::jsonb,
          ${blog.published_at}
        );
      `
    }

    console.log(`✓ Seeded ${sampleBlogs.length} sample blog posts`)

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

async function main() {
  try {
    await createBlogsTable()
    await seedSampleData()
    console.log('\n🎉 All done! Your database is ready.')
  } catch (error) {
    console.error('Error during migration:', error)
    process.exit(1)
  }
}

main()
