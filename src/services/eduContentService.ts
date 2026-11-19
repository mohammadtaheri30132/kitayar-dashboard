import api from './api'

export interface EduImageMeta {
  url: string | null
  imageType: 'real_cover' | 'graphic' | 'placeholder' | 'none'
  source: string
  status: 'approved' | 'pending' | 'needs_image'
  updatedAt?: string
}

export interface EduLevelItem {
  _id: string
  stableId: string
  name: string
  code: string
  order: number
  isActive: boolean
  image?: EduImageMeta
}

export interface EduGradeItem {
  _id: string
  stableId: string
  name: string
  numericOrder: number
  levelId: string
  order: number
  isActive: boolean
  image?: EduImageMeta
}

export interface EduFieldItem {
  _id: string
  stableId: string
  name: string
  levelId: string
  order: number
  isActive: boolean
  image?: EduImageMeta
}

export interface EduLessonItem {
  _id: string
  stableId: string
  bookId: string
  chapterId: string
  jsonKey: string
  title: string
  keywords: string[]
  order: number
  isActive: boolean
}

export interface EduChapterItem {
  _id: string
  stableId: string
  bookId: string
  jsonKey: string
  title: string
  keywords: string[]
  hasEmptyLessons: boolean
  order: number
  isActive: boolean
  lessons?: EduLessonItem[]
}

export interface EduBookItem {
  _id: string
  stableId: string
  title: string
  levelId: string | { _id: string; name: string; code?: string }
  gradeId: string | { _id: string; name: string; numericOrder?: number }
  fieldId: string | { _id: string; name: string } | null
  structure: 'chapter' | 'lesson'
  keywords: string[]
  order: number
  isActive: boolean
  image?: EduImageMeta
  chaptersCount?: number
  emptyLessonsCount?: number
  lessonsCount?: number
  matchedChaptersPreview?: Array<{ title: string; keywords: string[] }>
  chapters?: EduChapterItem[]
}

export interface EduStatsData {
  levels: number
  grades: number
  fields: number
  books: number
  chapterBooks: number
  lessonBooks: number
  chapters: number
  lessons: number
  emptyLessonChapters: number
  needsImageCount: number
  booksNeedImage: number
  backupsCount: number
  auditLogsCount: number
}

export type ImportMode = 'add_new' | 'update_existing' | 'merge' | 'replace_all'

export const eduContentService = {
  getStats: async () => {
    const res = await api.get('/edu-content/stats')
    return res.data
  },

  getTree: async (params?: {
    levelId?: string
    gradeId?: string
    fieldId?: string
    q?: string
    imageStatus?: string
    structure?: string
    includeContent?: boolean
  }) => {
    const res = await api.get('/edu-content/tree', { params })
    return res.data
  },

  getBookDetail: async (bookId: string) => {
    const res = await api.get(`/edu-content/books/${bookId}`)
    return res.data
  },

  // Levels
  createLevel: async (data: { name: string; code?: string; order?: number; isActive?: boolean }) =>
    (await api.post('/edu-content/levels', data)).data,
  updateLevel: async (id: string, data: Partial<EduLevelItem>) =>
    (await api.put(`/edu-content/levels/${id}`, data)).data,
  deleteLevel: async (id: string, confirm = false) =>
    (await api.delete(`/edu-content/levels/${id}`, { params: confirm ? { confirm: 'true' } : {} })).data,

  // Grades
  createGrade: async (data: { name: string; levelId: string; numericOrder?: number; order?: number; isActive?: boolean }) =>
    (await api.post('/edu-content/grades', data)).data,
  updateGrade: async (id: string, data: Partial<EduGradeItem>) =>
    (await api.put(`/edu-content/grades/${id}`, data)).data,
  deleteGrade: async (id: string, confirm = false) =>
    (await api.delete(`/edu-content/grades/${id}`, { params: confirm ? { confirm: 'true' } : {} })).data,

  // Fields
  createField: async (data: { name: string; levelId: string; order?: number; isActive?: boolean }) =>
    (await api.post('/edu-content/fields', data)).data,
  updateField: async (id: string, data: Partial<EduFieldItem>) =>
    (await api.put(`/edu-content/fields/${id}`, data)).data,
  deleteField: async (id: string, confirm = false) =>
    (await api.delete(`/edu-content/fields/${id}`, { params: confirm ? { confirm: 'true' } : {} })).data,

  // Books
  createBook: async (data: {
    title: string
    levelId: string
    gradeId: string
    fieldId?: string | null
    structure: 'chapter' | 'lesson'
    keywords?: string[]
    isActive?: boolean
  }) => (await api.post('/edu-content/books', data)).data,
  updateBook: async (id: string, data: Partial<EduBookItem>) =>
    (await api.put(`/edu-content/books/${id}`, data)).data,
  deleteBook: async (id: string, confirm = false) =>
    (await api.delete(`/edu-content/books/${id}`, { params: confirm ? { confirm: 'true' } : {} })).data,

  // Chapters
  createChapter: async (
    bookId: string,
    data: { title: string; jsonKey?: string; keywords?: string[]; isActive?: boolean }
  ) => (await api.post(`/edu-content/books/${bookId}/chapters`, data)).data,
  updateChapter: async (id: string, data: Partial<EduChapterItem>) =>
    (await api.put(`/edu-content/chapters/${id}`, data)).data,
  deleteChapter: async (id: string) => (await api.delete(`/edu-content/chapters/${id}`)).data,
  reorderChapters: async (bookId: string, orderedIds: string[]) =>
    (await api.put(`/edu-content/books/${bookId}/chapters/reorder`, { orderedIds })).data,

  // Lessons
  createLesson: async (
    chapterId: string,
    data: { title: string; jsonKey?: string; keywords?: string[]; isActive?: boolean }
  ) => (await api.post(`/edu-content/chapters/${chapterId}/lessons`, data)).data,
  updateLesson: async (id: string, data: Partial<EduLessonItem>) =>
    (await api.put(`/edu-content/lessons/${id}`, data)).data,
  deleteLesson: async (id: string) => (await api.delete(`/edu-content/lessons/${id}`)).data,

  reorderEntities: async (entityType: 'level' | 'grade' | 'field' | 'book' | 'chapter' | 'lesson', orderedIds: string[]) =>
    (await api.put(`/edu-content/reorder/${entityType}`, { orderedIds })).data,

  // Import / Export / Backups
  previewImportFile: async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return (await api.post('/edu-content/import/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data
  },
  applyImportFile: async (file: File, mode: ImportMode, confirmReplace = false) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('mode', mode)
    fd.append('confirmReplace', String(confirmReplace))
    return (await api.post('/edu-content/import/apply', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data
  },

  exportJson: async (params: {
    scope: 'all' | 'level' | 'grade' | 'field' | 'book' | 'chapters'
    id?: string
    chapterIds?: string[]
  }) => {
    const query: any = { scope: params.scope, includeStableIds: 'true' }
    if (params.id) query.id = params.id
    if (params.chapterIds?.length) query.chapterIds = params.chapterIds.join(',')
    const res = await api.get('/edu-content/export', { params: query })
    return res.data
  },

  getBackups: async () => (await api.get('/edu-content/backups')).data,
  createBackup: async (label?: string) => (await api.post('/edu-content/backups', { label })).data,
  restoreBackup: async (id: string) => (await api.post(`/edu-content/backups/${id}/restore`)).data,
  deleteBackup: async (id: string) => (await api.delete(`/edu-content/backups/${id}`)).data,

  // Media
  uploadImage: async (
    entityType: 'level' | 'grade' | 'field' | 'book',
    id: string,
    file: File,
    meta: { imageType: 'real_cover' | 'graphic' | 'placeholder'; status?: string; source?: string }
  ) => {
    const fd = new FormData()
    fd.append('image', file)
    fd.append('imageType', meta.imageType)
    if (meta.status) fd.append('status', meta.status)
    if (meta.source) fd.append('source', meta.source)
    return (
      await api.post(`/edu-content/media/${entityType}/${id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data
  },
  removeImage: async (entityType: 'level' | 'grade' | 'field' | 'book', id: string) =>
    (await api.delete(`/edu-content/media/${entityType}/${id}`)).data,

  // Question Bank linking, Custom Sections & Resources (PDF, StepByStep, Notes, Videos, Custom)
  getQuestionBooks: async () => (await api.get('/edu-content/question-books')).data,

  listCustomSections: async (params?: { levelId?: string; gradeId?: string; bookId?: string }) =>
    (await api.get('/edu-content/custom-sections', { params })).data,
  createCustomSection: async (payload: {
    title: string
    description?: string
    icon?: string
    levelId: string
    gradeId?: string | null
    fieldId?: string | null
    bookId?: string | null
  }) => (await api.post('/edu-content/custom-sections', payload)).data,
  updateCustomSection: async (id: string, payload: any) =>
    (await api.put(`/edu-content/custom-sections/${id}`, payload)).data,
  deleteCustomSection: async (id: string) =>
    (await api.delete(`/edu-content/custom-sections/${id}`)).data,

  listResources: async (params?: {
    levelId?: string
    gradeId?: string
    bookId?: string
    category?: string
    customSectionId?: string
  }) => (await api.get('/edu-content/resources', { params })).data,

  createResource: async (payload: {
    category: 'main_pdf' | 'step_by_step' | 'note' | 'video' | 'custom'
    customSectionId?: string | null
    contentType: 'pdf' | 'video' | 'text' | 'image' | 'link'
    levelId: string
    gradeId?: string | null
    fieldId?: string | null
    bookId?: string | null
    chapterId?: string | null
    lessonId?: string | null
    title: string
    description?: string
    fileUrl?: string
    textContent?: string
    file?: File | null
  }) => {
    const fd = new FormData()
    fd.append('category', payload.category)
    fd.append('contentType', payload.contentType)
    fd.append('levelId', payload.levelId)
    fd.append('title', payload.title)
    if (payload.customSectionId) fd.append('customSectionId', payload.customSectionId)
    if (payload.gradeId) fd.append('gradeId', payload.gradeId)
    if (payload.fieldId) fd.append('fieldId', payload.fieldId)
    if (payload.bookId) fd.append('bookId', payload.bookId)
    if (payload.chapterId) fd.append('chapterId', payload.chapterId)
    if (payload.lessonId) fd.append('lessonId', payload.lessonId)
    if (payload.description) fd.append('description', payload.description)
    if (payload.fileUrl) fd.append('fileUrl', payload.fileUrl)
    if (payload.textContent) fd.append('textContent', payload.textContent)
    if (payload.file) fd.append('file', payload.file)
    return (
      await api.post('/edu-content/resources', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data
  },

  deleteResource: async (id: string) => (await api.delete(`/edu-content/resources/${id}`)).data,

  getAuditLogs: async (limit = 50) => (await api.get('/edu-content/audit-logs', { params: { limit } })).data,
}
