# Personal Website

A minimalist personal website built with Next.js 15, TypeScript, and TailwindCSS.

## Features

- 🎨 Minimalist, clean design
- 🌗 Dark mode support
- 📱 Fully responsive
- ⚡ Built with Next.js App Router
- 🎯 TypeScript for type safety
- 💅 Styled with TailwindCSS
- 🚀 Optimized for Vercel deployment

## Getting Started

### Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Customization

1. **Update your information:**
   - Edit `components/Header.tsx` - Change "Your Name" to your actual name
   - Edit `components/Hero.tsx` - Update the hero text and tagline
   - Edit `components/About.tsx` - Add your bio and skills
   - Edit `components/Contact.tsx` - Add your actual email and social links
   - Edit `app/layout.tsx` - Update the metadata (title, description)

2. **Add your projects:**
   - Edit `lib/projects.ts` - Replace sample projects with your actual projects

3. **Add your blog posts:**
   - Edit `lib/blog.ts` - Add your blog posts
   - Or integrate with a CMS like Contentful, Sanity, or markdown files

4. **Customize colors:**
   - Edit `app/globals.css` - Modify the color scheme
   - Update Tailwind classes in components for different styling

## Deployment to Vercel

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. Deploy to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and configure everything
   - Click "Deploy"

3. Your site will be live at `your-project.vercel.app`

4. Optional: Add a custom domain in Vercel project settings

## Project Structure

```
├── app/
│   ├── blog/
│   │   ├── [slug]/
│   │   │   └── page.tsx      # Individual blog post
│   │   └── page.tsx           # Blog listing
│   ├── projects/
│   │   └── [slug]/
│   │       └── page.tsx       # Individual project
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/
│   ├── About.tsx
│   ├── Blog.tsx
│   ├── Contact.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Projects.tsx
│   └── ThemeProvider.tsx
├── lib/
│   ├── blog.ts                # Blog post data
│   └── projects.ts            # Project data
└── public/                    # Static assets
```

## Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Dark Mode:** next-themes
- **Deployment:** Vercel

## License

MIT License - feel free to use this template for your own personal website!
