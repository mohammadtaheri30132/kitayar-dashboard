import api from './api'

export interface CourseData {
  _id: string
  name: string
  code: string
  description: string
  order: number
  totalQuestions: number
}

export interface FieldData {
  _id: string
  name: string
  course: string
  order: number
}

export interface GradeData {
  _id: string
  name: string
  course: string
  field: string | FieldData
  order: number
  totalQuestions: number
}

export interface BookData {
  _id: string
  name: string
  grade: string
  order: number
  totalQuestions: number
  icon: string
}

export const courseService = {
  getAll: async () => {
    const response = await api.get('/courses')
    return response.data
  },
}

export const fieldService = {
  getByCourse: async (courseId: string) => {
    const response = await api.get(`/fields/course/${courseId}`)
    return response.data
  },
}

export const gradeService = {
  getByCourse: async (courseId: string, fieldId?: string) => {
    const params = fieldId ? { field: fieldId } : {}
    const response = await api.get(`/grades/course/${courseId}`, { params })
    return response.data
  },
}

export const bookService = {
  getByGrade: async (gradeId: string) => {
    const response = await api.get(`/books/grade/${gradeId}`)
    return response.data
  },
}
