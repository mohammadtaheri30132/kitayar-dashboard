import api from './api'

export interface SubQuestionData { sub_id: string; type: string; question: string; options: string[]; page_number: number[]; answer: string }
export interface QuestionData {
  _id?: string; question_id: string; book: string
  grade?: string | { _id: string; name: string }; course?: string | { _id: string; name: string; code: string }
  type: string; difficulty: string; question: string
  options: string[]; matching_left: string[]; matching_right: string[]
  answer: string; lesson_id: number; page_number: number[]; source_image: string
  createdAt?: string; is_composite?: boolean; sub?: SubQuestionData[]
  status?: string; tags?: string[]
}

export function parsePageNumbers(input: any): number[] {
  if (input === undefined || input === null || input === '') return []
  if (Array.isArray(input)) return input.map(Number).filter(n => !isNaN(n) && n > 0)
  let str = String(input).trim(); if (!str) return []
  const rangeMatch = str.match(/^(\d+)\s*-\s*(\d+)$/)
  if (rangeMatch) { const s = parseInt(rangeMatch[1]), e = parseInt(rangeMatch[2]); if (s > 0 && e >= s) return Array.from({ length: e - s + 1 }, (_, i) => s + i) }
  return str.split(/[,،و/\\\s]+/).filter(Boolean).map(p => parseInt(p.replace(/[^\d]/g, ''))).filter(n => !isNaN(n) && n > 0)
}

export const questionService = {
  getByBook: async (bookId: string, params?: any) => { const r = await api.get(`/questions/book/${bookId}`, { params }); return r.data },
  getById: async (id: string) => { const r = await api.get(`/questions/${id}`); return r.data },
  create: async (data: Partial<QuestionData>) => { const r = await api.post('/questions', data); return r.data },
  update: async (id: string, data: Partial<QuestionData>) => { const r = await api.put(`/questions/${id}`, data); return r.data },
  delete: async (id: string) => { const r = await api.delete(`/questions/${id}`); return r.data },
  importBatch: async (questions: any[], bookId?: string) => { const r = await api.post('/questions/import', { questions, bookId }); return r.data },
  forceImport: async (question: any, bookId: string) => { const r = await api.post('/questions/force-import', { ...question, book: bookId }); return r.data },
  batchUpdate: async (ids: string[], action: string, value?: string) => { const r = await api.post('/questions/batch', { ids, action, value }); return r.data },
  updateStatus: async (id: string, status: string) => { const r = await api.patch(`/questions/${id}/status`, { status }); return r.data },
  updateTags: async (id: string, tags: string[]) => { const r = await api.patch(`/questions/${id}/tags`, { tags }); return r.data },
}
