export interface BlogPost {
  id: string
  title: string
  excerpt: string
  date: string
  content: string
}

export const blogPosts: BlogPost[] = [
  {
    id: 'getting-started-with-nextjs',
    title: 'Getting Started with Next.js 15',
    excerpt: 'Learn how to build modern web applications with Next.js 15 and the App Router',
    date: '2024-11-10',
    content: `
# Getting Started with Next.js 15

Next.js 15 introduces several exciting features that make building web applications even better...

## App Router

The App Router is the recommended way to build Next.js applications...

## Server Components

React Server Components allow you to render components on the server...
    `.trim()
  },
  {
    id: 'mastering-typescript',
    title: 'Mastering TypeScript in React',
    excerpt: 'Best practices for using TypeScript in React applications',
    date: '2024-11-05',
    content: `
# Mastering TypeScript in React

TypeScript has become an essential tool for building robust React applications...

## Type Safety

Learn how to leverage TypeScript's type system...
    `.trim()
  },
  {
    id: 'tailwind-tips',
    title: '10 TailwindCSS Tips for Developers',
    excerpt: 'Essential TailwindCSS tips to improve your workflow',
    date: '2024-10-28',
    content: `
# 10 TailwindCSS Tips for Developers

TailwindCSS is a utility-first CSS framework that can dramatically speed up your development...

## Custom Utilities

Learn how to create custom utilities...
    `.trim()
  }
]

export function getBlogPostById(id: string): BlogPost | undefined {
  return blogPosts.find(post => post.id === id)
}

export function getRecentPosts(limit: number = 3): BlogPost[] {
  return blogPosts.slice(0, limit)
}
