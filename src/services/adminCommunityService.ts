import api from './api'

export interface AdminCommunityStats {
  totalQuestions: number
  totalPosts: number
  totalAnswers: number
  totalComments: number
  totalCategories: number
  pendingReports: number
  unansweredQuestions: number
  resolvedQuestions: number
  activeUsers: number
  recentQuestions: any[]
  recentPosts: any[]
}

export interface AdminCategory {
  _id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  order: number
  isActive: boolean
  questionCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminQuestion {
  _id: string
  title: string
  body: string
  author: {
    _id: string
    name: string
    role?: string
    avatar?: string
  }
  category?: {
    _id: string
    name: string
    color?: string
  } | null
  tags?: string[]
  answerCount: number
  viewCount: number
  likeCount: number
  isResolved: boolean
  isPinned: boolean
  status: 'active' | 'pending_review' | 'hidden' | 'deleted'
  moderationReason?: string
  attachments?: { url: string; type: 'image' | 'file'; name?: string }[]
  reportCount: number
  createdAt: string
}

export interface AdminAnswer {
  _id: string
  question: {
    _id: string
    title: string
  }
  author: {
    _id: string
    name: string
    role?: string
    avatar?: string
  }
  body: string
  attachments?: { url: string; type: 'image' | 'file'; name?: string }[]
  isAccepted: boolean
  likeCount: number
  status: 'active' | 'pending_review' | 'hidden' | 'deleted'
  moderationReason?: string
  createdAt: string
}

export interface AdminCommunitySettings {
  forbiddenWords: string[]
  autoApproveText: boolean
  requireApprovalForImages: boolean
}

export interface AdminPost {
  _id: string
  content: string
  images?: string[]
  author: {
    _id: string
    name: string
    role?: string
  }
  likeCount: number
  commentCount: number
  isPinned: boolean
  status: 'active' | 'hidden' | 'deleted'
  reportCount: number
  createdAt: string
}

export interface AdminComment {
  _id: string
  post: {
    _id: string
    content: string
  }
  author: {
    _id: string
    name: string
  }
  content: string
  status: 'active' | 'hidden' | 'deleted'
  createdAt: string
}

export interface AdminReport {
  _id: string
  targetType: 'question' | 'answer' | 'post' | 'comment'
  targetId: string
  reporter?: {
    _id: string
    name: string
    phone?: string
  }
  reason: string
  description?: string
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  moderatorNotes?: string
  actionTaken?: string
  targetDetails?: any
  createdAt: string
}

export interface AdminRestriction {
  _id: string
  user: {
    _id: string
    name: string
    phone?: string
  }
  restrictedBy: {
    _id: string
    name: string
  }
  reason: string
  blockedActions: string[]
  expiresAt?: string
  isActive: boolean
  createdAt: string
}

export interface AdminAuditLog {
  _id: string
  actor: {
    _id: string
    name: string
  }
  action: string
  targetType: string
  targetId?: string
  details?: any
  createdAt: string
}

export const adminCommunityService = {
  // Stats
  getStats: async (): Promise<AdminCommunityStats> => {
    const res = await api.get('/community/stats')
    return res.data?.data
  },

  // Categories
  getCategories: async (): Promise<AdminCategory[]> => {
    const res = await api.get('/community/categories')
    return res.data?.data || []
  },

  createCategory: async (data: Partial<AdminCategory>): Promise<AdminCategory> => {
    const res = await api.post('/community/categories', data)
    return res.data?.data
  },

  updateCategory: async (id: string, data: Partial<AdminCategory>): Promise<AdminCategory> => {
    const res = await api.put(`/community/categories/${id}`, data)
    return res.data?.data
  },

  deleteCategory: async (id: string, reassignToCategoryId?: string): Promise<void> => {
    await api.delete(`/community/categories/${id}`, { data: { reassignToCategoryId } })
  },

  reorderCategories: async (orders: { id: string; order: number }[]): Promise<void> => {
    await api.put('/community/categories/reorder', { orders })
  },

  // Questions
  getQuestions: async (params?: any): Promise<{ questions: AdminQuestion[]; pagination: any }> => {
    const res = await api.get('/community/questions', { params })
    return {
      questions: res.data?.data || [],
      pagination: res.data?.pagination || {},
    }
  },

  updateQuestionStatus: async (id: string, data: { status?: string; isPinned?: boolean; isResolved?: boolean }) => {
    const res = await api.put(`/community/questions/${id}/status`, data)
    return res.data?.data
  },

  // Answers
  getAnswers: async (params?: any): Promise<{ answers: AdminAnswer[]; pagination: any }> => {
    const res = await api.get('/community/answers', { params })
    return {
      answers: res.data?.data || [],
      pagination: res.data?.pagination || {},
    }
  },

  updateAnswerStatus: async (id: string, status: string) => {
    const res = await api.put(`/community/answers/${id}/status`, { status })
    return res.data?.data
  },

  // Posts
  getPosts: async (params?: any): Promise<{ posts: AdminPost[]; pagination: any }> => {
    const res = await api.get('/community/posts', { params })
    return {
      posts: res.data?.data || [],
      pagination: res.data?.pagination || {},
    }
  },

  updatePostStatus: async (id: string, data: { status?: string; isPinned?: boolean }) => {
    const res = await api.put(`/community/posts/${id}/status`, data)
    return res.data?.data
  },

  // Comments
  getComments: async (params?: any): Promise<{ comments: AdminComment[]; pagination: any }> => {
    const res = await api.get('/community/comments', { params })
    return {
      comments: res.data?.data || [],
      pagination: res.data?.pagination || {},
    }
  },

  updateCommentStatus: async (id: string, status: string) => {
    const res = await api.put(`/community/comments/${id}/status`, { status })
    return res.data?.data
  },

  // Reports
  getReports: async (params?: any): Promise<{ reports: AdminReport[]; pagination: any }> => {
    const res = await api.get('/community/reports', { params })
    return {
      reports: res.data?.data || [],
      pagination: res.data?.pagination || {},
    }
  },

  resolveReport: async (id: string, data: { status: string; moderatorNotes?: string; actionTaken?: string }) => {
    const res = await api.put(`/community/reports/${id}/resolve`, data)
    return res.data?.data
  },

  // Restrictions
  getRestrictions: async (params?: any): Promise<{ restrictions: AdminRestriction[]; pagination: any }> => {
    const res = await api.get('/community/restrictions', { params })
    return {
      restrictions: res.data?.data || [],
      pagination: res.data?.pagination || {},
    }
  },

  restrictUser: async (data: { userId: string; reason: string; durationDays?: number }) => {
    const res = await api.post('/community/restrictions', data)
    return res.data?.data
  },

  unrestrictUser: async (id: string) => {
    const res = await api.delete(`/community/restrictions/${id}`)
    return res.data?.data
  },

  // Approvals & Moderation Queue
  approveQuestion: async (id: string): Promise<AdminQuestion> => {
    const res = await api.put(`/community/questions/${id}/approve`)
    return res.data?.data
  },

  approveAnswer: async (id: string): Promise<AdminAnswer> => {
    const res = await api.put(`/community/answers/${id}/approve`)
    return res.data?.data
  },

  getPendingReviews: async (): Promise<{ questions: AdminQuestion[]; answers: AdminAnswer[]; total: number }> => {
    const res = await api.get('/community/pending-reviews')
    return res.data?.data || { questions: [], answers: [], total: 0 }
  },

  // Moderation Settings & Forbidden Words
  getSettings: async (): Promise<AdminCommunitySettings> => {
    const res = await api.get('/community/settings')
    return res.data?.data
  },

  updateSettings: async (data: Partial<AdminCommunitySettings>): Promise<AdminCommunitySettings> => {
    const res = await api.put('/community/settings', data)
    return res.data?.data
  },

  addForbiddenWord: async (word: string): Promise<string[]> => {
    const res = await api.post('/community/forbidden-words', { word })
    return res.data?.data
  },

  removeForbiddenWord: async (word: string): Promise<string[]> => {
    const res = await api.delete(`/community/forbidden-words/${encodeURIComponent(word)}`)
    return res.data?.data
  },

  // Audit Logs
  getAuditLogs: async (params?: any): Promise<{ logs: AdminAuditLog[]; pagination: any }> => {
    const res = await api.get('/community/audit-logs', { params })
    return {
      logs: res.data?.data || [],
      pagination: res.data?.pagination || {},
    }
  },
}
