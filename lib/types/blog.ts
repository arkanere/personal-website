/**
 * Blog Types and Interfaces
 */

export type BlogStatus = 'draft' | 'published' | 'archived'

export interface FeaturedImage {
  url: string
  cloudinaryId?: string
  width?: number
  height?: number
  alt?: string
}

export interface SEOMetadata {
  metaTitle: string
  metaDescription: string
  keywords: string
}

export interface Blog {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  featured_image: FeaturedImage | null
  seo_metadata: SEOMetadata
  author_name: string
  status: BlogStatus
  tags: string[]
  categories: string[]
  published_at: Date | null
  view_count: number
  created_at: Date
  updated_at: Date
}

export interface BlogFormData {
  title: string
  slug: string
  content: string
  excerpt?: string
  featured_image?: FeaturedImage | null
  author_name: string
  status: BlogStatus
  tags: string[]
  categories: string[]
  seo_metadata: SEOMetadata
}

export interface BlogListItem {
  id: number
  title: string
  slug: string
  excerpt: string | null
  author_name: string
  status: BlogStatus
  published_at: Date | null
  created_at: Date
  updated_at: Date
  view_count: number
}

export interface CreateBlogRequest {
  title: string
  slug: string
  content: string
  excerpt?: string | null
  featured_image?: FeaturedImage | null
  author_name: string
  status: BlogStatus
  tags?: string[]
  categories?: string[]
  seo_metadata: SEOMetadata
  published_at?: Date | null
}

export interface UpdateBlogRequest extends CreateBlogRequest {
  id: number
}

export interface BlogFilters {
  search?: string
  status?: BlogStatus | 'all'
  sortBy?: 'newest' | 'oldest' | 'most-viewed'
}
