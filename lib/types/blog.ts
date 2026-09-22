export type BlogStatus = 'draft' | 'published' | 'archived'

/** A twenty-words-max unit: the smallest unit of complete meaning. */
export interface Twm {
  id: string
  /** The keyword this twm was seeded by, if any. */
  seed: string | null
  text: string
}

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
  /** Search-engine keywords. Not the draft keywords of the writing stages. */
  keywords: string
}

/** index_blog_id is the member article listed on the home page for the series. */
export interface Series {
  id: number
  title: string
  slug: string
  description: string | null
  index_blog_id: number | null
  created_at: Date
  updated_at: Date
}

/** A series along with the members needed to manage it in the admin UI. */
export interface SeriesWithPosts extends Series {
  posts: SeriesPost[]
}

export interface SeriesPost {
  id: number
  title: string
  slug: string
  status: BlogStatus
  series_order: number | null
}

export interface SeriesFormData {
  title: string
  slug: string
  description?: string | null
  index_blog_id?: number | null
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
  series_id: number | null
  series_order: number | null
  braindump: string
  /** The concepts pulled out of the brain dump. Not seo_metadata.keywords. */
  draft_keywords: string[]
  twms: Twm[]
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
  series_id: number | null
  series_order: number | null
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
  tags: string[]
  series_id: number | null
  series_order: number | null
  series_title: string | null
  series_slug: string | null
  /** True when this article is the one its series shows on the home page. */
  is_series_index: boolean
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
  series_id?: number | null
  series_order?: number | null
  /** When true, the series named by series_id adopts this article as its index. */
  is_series_index?: boolean
  braindump?: string
  draft_keywords?: string[]
  twms?: Twm[]
  seo_metadata: SEOMetadata
  published_at?: Date | null
}

export interface UpdateBlogRequest extends CreateBlogRequest {
  id: number
}

export interface BlogFilters {
  search?: string
  status?: BlogStatus | 'all'
  /** A series id, 'all', or 'none' for independent articles only. */
  series?: number | 'all' | 'none'
  sortBy?: 'newest' | 'oldest' | 'most-viewed'
}
