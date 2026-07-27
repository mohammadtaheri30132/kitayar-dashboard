import api from './api'

export interface SubQuestionData {
  sub_id: string
  type: string
  question: string
  options: string[]
  page_number: number[]
  answer: string
}

export interface QuestionData {
  _id?: string
  question_id: string
  book: string
  grade?: string | { _id: string; name: string }
  course?: string | { _id: string; name: string; code: string }
  type: string
  difficulty: string
  question: string
  options: string[]
  matching_left: string[]
  matching_right: string[]
  answer: string
  lesson_id: number
  page_number: number[]
  source_image: string
  createdAt?: string
  is_composite?: boolean
  sub?: SubQuestionData[]
}

export function parsePageNumbers(input: any): number[] {
  if (input === undefined || input === null || input === '') return []
  if (Array.isArray(input)) return input.map(Number).filter(n => !isNaN(n) && n > 0)
  let str = String(input).trim()
  if (!str) return []
  const rangeMatch = str.match(/^(\d+)\s*-\s*(\d+)$/)
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]), end = parseInt(rangeMatch[2])
    if (start > 0 && end >= start) return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }
  const parts = str.split(/[,،و/\\\s]+/).filter(Boolean)
  return parts.map(p => parseInt(p.replace(/[^\d]/g, ''))).filter(n => !isNaN(n) && n > 0)
}

function processImportQuestion(q: any): any {
  const hasSub = q.sub && Array.isArray(q.sub) && q.sub.length > 0
  return {
    ...q,
    type: hasSub ? 'ترکیبی' : (q.type || 'تستی'),
    page_number: parsePageNumbers(q.page_number),
    sub: hasSub ? q.sub.map((s: any) => ({
      ...s,
      page_number: parsePageNumbers(s.page_number),
    })) : [],
  }
}

export const questionService = {
  getByBook: async (bookId: string, params?: any) => {
    const response = await api.get(`/questions/book/${bookId}`, { params })
    return response.data
  },
  getById: async (id: string) => {
    const response = await api.get(`/questions/${id}`)
    return response.data
  },
  create: async (data: Partial<QuestionData>) => {
    const payload = {
      ...data,
      page_number: Array.isArray(data.page_number) ? data.page_number : data.page_number ? [data.page_number] : [],
    }
    const response = await api.post('/questions', payload)
    return response.data
  },
  update: async (id: string, data: Partial<QuestionData>) => {
    const payload = {
      ...data,
      page_number: Array.isArray(data.page_number) ? data.page_number : data.page_number ? [data.page_number] : [],
    }
    const response = await api.put(`/questions/${id}`, payload)
    return response.data
  },
  delete: async (id: string) => {
    const response = await api.delete(`/questions/${id}`)
    return response.data
  },
  importBatch: async (questions: Partial<QuestionData>[], bookId?: string) => {
    const processed = questions.map(q => processImportQuestion(q))
    const payload: any = { questions: processed }
    if (bookId) payload.bookId = bookId
    const response = await api.post('/questions/import', payload)
    return response.data
  },
}
