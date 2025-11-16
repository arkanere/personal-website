# Blog CMS Setup Guide

This guide will help you set up and configure the blog CMS for your personal website.

## Overview

Your blog CMS includes:
- ✅ PostgreSQL database for blog storage
- ✅ Full admin interface with CRUD operations
- ✅ Rich text editor (TipTap) with formatting options
- ✅ Draft/Published/Archived status management
- ✅ SEO metadata fields
- ✅ Auto-generating slugs with validation
- ✅ Search, filter, and sort capabilities
- ✅ View count tracking
- ✅ OAuth authentication (Google)
- ✅ Dark mode support

## Setup Steps

### 1. Set Up Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Storage → Create Database → Postgres
3. Create a new Postgres database
4. Copy the connection details

### 2. Configure Environment Variables

1. Create a `.env.local` file in the project root (use `.env.example` as reference):

```bash
cp .env.example .env.local
```

2. Fill in the required values:

```env
# Database (from Vercel Postgres dashboard)
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to APIs & Services → Credentials
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
5. Copy the Client ID and Client Secret to `.env.local`

### 4. Run Database Migration

Run the migration script to create the `blogs` table and seed sample data:

```bash
npx tsx scripts/migrate-db.ts
```

This will:
- Create the `blogs` table with all necessary fields
- Add indexes for better query performance
- Set up auto-update triggers
- Seed 3 sample blog posts (2 published, 1 draft)

### 5. Start Development Server

```bash
npm run dev
```

### 6. Access Admin Dashboard

1. Navigate to `http://localhost:3000/admin/blogs`
2. You'll be redirected to the sign-in page
3. Sign in with your Google account
4. You should now see the admin dashboard with sample blogs

## Features Guide

### Admin Interface (`/admin/blogs`)

**Blog List Page:**
- View all blogs with statistics (total, published, drafts, archived)
- Search by title or excerpt
- Filter by status (all/draft/published/archived)
- Sort by newest, oldest, or most viewed
- Quick actions: Edit, View (if published), Delete

**Create Blog (`/admin/blogs/create`):**
- Title field with character limit (255)
- Auto-generating slug with real-time validation
- Excerpt field (optional, 500 chars)
- Rich text editor (TipTap) with:
  - Bold, Italic formatting
  - Headings (H2, H3, H4)
  - Bullet and numbered lists
  - Blockquotes
  - Code blocks
  - Links
  - Undo/Redo
- SEO settings (collapsible):
  - Meta title
  - Meta description
  - Keywords
- Status selector (draft/published)
- Author name field
- Categories and tags (comma-separated)
- Actions: Save as Draft, Publish Now

**Edit Blog (`/admin/blogs/[id]/edit`):**
- All create features plus:
  - Info banner showing status, published date, last updated, views
  - Archive status option
  - View on Site button (if published)
  - Delete blog button

### Public Pages

**Blog List (`/blog`):**
- Shows all published blogs
- Displays title, excerpt, and published date
- Sorted by published date (newest first)
- Links to individual blog posts

**Blog Detail (`/blog/[slug]`):**
- Displays full blog content (rendered HTML)
- Shows author name and published date
- SEO metadata (title, description, keywords, Open Graph)
- Automatically increments view count
- "Back to blog" navigation

### Database Schema

The `blogs` table includes:

```sql
- id: Serial primary key
- title: VARCHAR(255) - Blog title
- slug: VARCHAR(255) - URL-friendly slug (unique)
- content: TEXT - HTML content from TipTap
- excerpt: TEXT - Brief description (optional)
- featured_image: JSONB - Image metadata (not implemented yet)
- seo_metadata: JSONB - SEO fields (metaTitle, metaDescription, keywords)
- author_name: VARCHAR(255) - Author's name
- status: VARCHAR(50) - draft/published/archived
- tags: TEXT[] - Array of tags
- categories: TEXT[] - Array of categories
- published_at: TIMESTAMP - Publication date
- view_count: INTEGER - Number of views
- created_at: TIMESTAMP - Auto-generated
- updated_at: TIMESTAMP - Auto-updated
```

## Security

- Admin routes (`/admin/*`) are protected by NextAuth middleware
- All API routes check for authentication
- Only authenticated users can create, edit, or delete blogs
- Public pages only show published blogs

## Optional Enhancements (Not Implemented)

These features from the reference implementation are not included but can be added:

1. **Image Upload** (Cloudinary integration):
   - Add featured image upload
   - In-content image insertion
   - Image management

2. **Email Whitelist**:
   - Restrict admin access to specific email addresses
   - Add `ADMIN_EMAILS` to `.env.local`
   - Uncomment the signIn callback in `lib/auth.ts`

3. **GitHub OAuth**:
   - Uncomment GitHub provider in `lib/auth.ts`
   - Add credentials in Google Cloud Console
   - Add `GITHUB_ID` and `GITHUB_SECRET` to `.env.local`

## API Routes

### Public
- `GET /api/blogs/validate-slug` - Check slug availability

### Protected (Requires Authentication)
- `POST /api/blogs` - Create new blog
- `PATCH /api/blogs/[id]` - Update blog
- `DELETE /api/blogs/[id]` - Delete blog
- `GET /api/admin/blogs` - Get all blogs for admin
- `GET /api/admin/blogs/[id]` - Get single blog details

## Troubleshooting

### Database Connection Issues
- Verify all `POSTGRES_*` environment variables are correct
- Check Vercel Postgres dashboard for connection status
- Ensure database is in the same region as your deployment

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set and unique
- Check Google OAuth credentials are correct
- Ensure redirect URIs match your domain exactly
- Try clearing browser cookies and signing in again

### Migration Errors
- Ensure database connection is working
- Check if table already exists (migration will skip if it does)
- Review error logs for specific SQL issues

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors with `npm run build`
- Verify all environment variables are set

## Development Tips

1. **Testing Locally:**
   - Use `http://localhost:3000` for `NEXTAUTH_URL`
   - Add localhost to Google OAuth redirect URIs

2. **Deploying to Production:**
   - Update `NEXTAUTH_URL` to your production domain
   - Add production redirect URI to Google OAuth
   - All Vercel Postgres env vars are auto-populated on Vercel

3. **Customization:**
   - Update site name in `/app/layout.tsx` metadata
   - Customize colors in `/app/globals.css`
   - Modify blog preview in `/components/Blog.tsx` to use database

## File Structure

```
/app
  /admin
    /blogs
      /[id]
        /edit
          page.tsx          # Edit blog page
      /create
        page.tsx            # Create blog page
      page.tsx              # Blog list page
    layout.tsx              # Admin layout with navigation
  /api
    /admin
      /blogs
        /[id]
          route.ts          # Get single blog
        route.ts            # Get all blogs
    /auth
      /[...nextauth]
        route.ts            # NextAuth handler
    /blogs
      /[id]
        route.ts            # Update/delete blog
      /validate-slug
        route.ts            # Slug validation
      route.ts              # Create blog
  /auth
    /error
      page.tsx              # Auth error page
    /signin
      page.tsx              # Sign in page
  /blog
    /[slug]
      page.tsx              # Blog detail page
    page.tsx                # Blog list page

/components
  AuthProvider.tsx          # NextAuth session provider
  SlugInput.tsx            # Auto-generating slug input
  StatusBadge.tsx          # Status indicator
  TipTapEditor.tsx         # Rich text editor

/lib
  /hooks
    useDebounce.ts         # Debounce hook
  /types
    blog.ts                # Blog TypeScript types
  auth.ts                  # NextAuth configuration

/scripts
  migrate-db.ts            # Database migration script

middleware.ts              # Route protection
.env.example              # Environment variables template
```

## Next Steps

1. Customize the site metadata and branding
2. Add your own content through the admin interface
3. Consider adding image upload functionality
4. Set up email whitelist if needed
5. Deploy to Vercel

## Support

For issues or questions:
- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [NextAuth.js documentation](https://next-auth.js.org/)
- Check [TipTap documentation](https://tiptap.dev/)
- Review [Vercel Postgres documentation](https://vercel.com/docs/storage/vercel-postgres)
