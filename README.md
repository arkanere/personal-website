# Personal Website

A personal site and its blog CMS, built around a four-stage writing process.
Next.js (App Router), TypeScript, Postgres, plain CSS.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | public | Home, listing published articles and series |
| `/blog` | public | Redirects to `/` |
| `/blog/[slug]` | public | A published article (drafts 404) |
| `/write` | public | The writing stages, saving nothing |
| `/admin/blogs` | admin | List, filter by tag, create, edit, delete |
| `/auth/signin` | public | Google sign-in |
| `/api/blogs/*`, `/api/series/*`, `/api/admin/*` | admin | CRUD behind a session + whitelist check |

## Access control

Sign-in is Google OAuth through NextAuth. `ADMIN_EMAILS` is a comma-separated
whitelist: an address not on it is refused at sign-in, and every write API
route re-checks it against the session. **If `ADMIN_EMAILS` is unset, nobody
can sign in** — the list fails closed on purpose.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill it in:

```bash
cp .env.example .env.local
```

You need a Vercel Postgres database, a Google OAuth client, a `NEXTAUTH_SECRET`
(`openssl rand -base64 32`), and your own address in `ADMIN_EMAILS`.

3. Create the tables:

```bash
npx tsx scripts/migrate-db.ts
```

4. Run it:

```bash
npm run dev
```

## Scripts

Migrations are plain scripts, run with `npx tsx`, each adding what its name
says to an existing database:

- `scripts/migrate-db.ts` — creates the blogs table
- `scripts/migrate-writing-stages.ts` — brain dump, twms
- `scripts/migrate-draft-keywords.ts` — draft keywords
- `scripts/migrate-series.ts` — series and ordering
- `scripts/migrate-publish-guard.ts` — the publish guard
- `scripts/check-writing.ts` — asserts the stage rules (twm ceiling, publish
  guard) with no database or server needed
- `scripts/check-auth.ts` — asserts the admin whitelist, including that an
  unset list admits nobody

Both checks run together with `npm run check`.

## Project structure

```
├── app/
│   ├── admin/            # Admin UI (blog list, create, edit)
│   ├── api/              # Route handlers: blogs, series, auth
│   ├── auth/             # Sign-in and error pages
│   ├── blog/             # Public listing and article pages
│   ├── write/            # The public, unsaved writing tool
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── stages/           # The four stage panels and their modals
│   ├── TipTapEditor.tsx  # Rich text editor for the final format
│   ├── SeriesManager.tsx, SeriesPicker.tsx, SlugInput.tsx, StageTabs.tsx
│   └── Header.tsx, Footer.tsx, ThemeProvider.tsx, ThemeToggle.tsx
├── lib/
│   ├── lifecycle.ts      # Stage rules: twm limit, keywords, publish guard
│   ├── series.ts         # Series membership and index syncing
│   ├── pg.ts             # Postgres array encoding
│   ├── auth.ts           # NextAuth options and the admin whitelist
│   └── types/blog.ts
├── scripts/              # Database migrations
└── middleware.ts         # Guards /admin
```

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript
- **Database:** Vercel Postgres
- **Auth:** NextAuth, Google OAuth
- **Editor:** TipTap
- **Forms:** react-hook-form, zod
- **Styling:** plain CSS, `next-themes` for dark mode
- **Deployment:** Vercel

## License

MIT — see [LICENSE](LICENSE).
