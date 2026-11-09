import api from './api'

export interface BlogFaqItem {
  question: string
  answer: string
}

export interface BlogPostSeo {
  focusKeyword: string
  metaTitle: string
  metaDescription: string
  canonicalUrl: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  robotsNoIndex: boolean
  robotsNoFollow: boolean
  schemaType: 'BlogPosting' | 'Article' | 'NewsArticle'
  seoScore: number
}

export interface BlogPostItem {
  _id: string
  title: string
  slug: string
  excerpt: string
  content?: string
  coverImage: string
  coverImageAlt: string
  category: string
  tags: string[]
  author: {
    name: string
    role: string
    avatar?: string
  }
  readingTime: number
  views: number
  isFeatured: boolean
  isPublished: boolean
  publishedAt: string
  targetAudience?: 'kitayar' | 'nokita' | 'all'
  seo?: BlogPostSeo
  faqs?: BlogFaqItem[]
  createdAt?: string
  updatedAt?: string
}

export interface BlogMediaItem {
  _id: string
  filename: string
  originalName: string
  url: string
  mimeType: string
  size: number
  title: string
  alt: string
  caption: string
  createdAt: string
}

export interface BlogSeoSettingsData {
  blogTitle: string
  blogSubtitle: string
  titleSeparator: string
  siteNameSuffix: string
  defaultMetaDescription: string
  defaultKeywords: string[]
  defaultOgImage: string
  googleSiteVerification: string
  bingSiteVerification: string
  defaultRobotsIndex: boolean
  defaultRobotsFollow: boolean
  categories: string[]
  organizationName: string
  ctaBoxTitle: string
  ctaBoxSubtitle: string
  ctaBoxButtonText: string
  ctaBoxButtonLink: string
}

export interface BlogSeoAudit {
  totalPublished: number
  missingFocusKeyword: number
  missingMetaDescription: number
  noIndexCount: number
  missingMediaAlt: number
}

// ==================== POSTS ====================

export async function fetchAdminBlogPosts(params?: {
  search?: string
  category?: string
  status?: string
  targetAudience?: string
}) {
  const res = await api.get('/blog/posts', { params })
  return res.data as {
    success: boolean
    data: BlogPostItem[]
    stats: {
      total: number
      published: number
      drafts: number
      totalViews: number
      avgSeoScore: number
    }
  }
}

export async function fetchAdminBlogPost(id: string) {
  const res = await api.get(`/blog/posts/${id}`)
  return res.data as { success: boolean; data: BlogPostItem }
}

export async function createAdminBlogPost(payload: Partial<BlogPostItem>) {
  const res = await api.post('/blog/posts', payload)
  return res.data as { success: boolean; message: string; data: BlogPostItem }
}

export async function updateAdminBlogPost(id: string, payload: Partial<BlogPostItem>) {
  const res = await api.put(`/blog/posts/${id}`, payload)
  return res.data as { success: boolean; message: string; data: BlogPostItem }
}

export async function toggleAdminBlogPostPublish(id: string) {
  const res = await api.patch(`/blog/posts/${id}/publish`)
  return res.data as { success: boolean; message: string; data: { _id: string; isPublished: boolean } }
}

export async function deleteAdminBlogPost(id: string) {
  const res = await api.delete(`/blog/posts/${id}`)
  return res.data as { success: boolean; message: string }
}

// ==================== MEDIA LIBRARY ====================

export async function fetchBlogMedia(params?: { search?: string; page?: number; limit?: number }) {
  const res = await api.get('/blog/media', { params })
  return res.data as {
    success: boolean
    data: BlogMediaItem[]
    pagination: { page: number; limit: number; total: number; pages: number }
    stats: { totalFiles: number; missingAltCount: number; totalBytes: number }
  }
}

export async function uploadBlogMedia(
  files: File[],
  onProgress?: (percent: number) => void
) {
  const formData = new FormData()
  files.forEach((f) => formData.append('files', f))

  const res = await api.post('/blog/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (evt.total && onProgress) {
        onProgress(Math.round((evt.loaded * 100) / evt.total))
      }
    },
  })
  return res.data as { success: boolean; message: string; data: BlogMediaItem[] }
}

export async function updateBlogMedia(
  id: string,
  payload: { title?: string; alt?: string; caption?: string }
) {
  const res = await api.put(`/blog/media/${id}`, payload)
  return res.data as { success: boolean; message: string; data: BlogMediaItem }
}

export async function deleteBlogMedia(id: string) {
  const res = await api.delete(`/blog/media/${id}`)
  return res.data as { success: boolean; message: string }
}

// ==================== GLOBAL SEO SETTINGS ====================

export async function fetchBlogSeoSettings(target?: 'kitayar' | 'nokita') {
  const res = await api.get('/blog/seo-settings', { params: { target: target || 'kitayar' } })
  return res.data as {
    success: boolean
    data: BlogSeoSettingsData
    audit: BlogSeoAudit
  }
}

export async function saveBlogSeoSettings(payload: Partial<BlogSeoSettingsData>, target?: 'kitayar' | 'nokita') {
  const res = await api.put('/blog/seo-settings', { ...payload, target: target || 'kitayar' })
  return res.data as { success: boolean; message: string; data: BlogSeoSettingsData }
}

