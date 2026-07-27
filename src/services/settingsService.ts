import api from './api'

// ============ Course ============
export const settingsCourseService = {
  create: async (data: { name: string; code: string; description: string; order: number }) => {
    const res = await api.post('/courses', data)
    return res.data
  },
  update: async (id: string, data: Partial<{ name: string; description: string; order: number }>) => {
    const res = await api.put(`/courses/${id}`, data)
    return res.data
  },
  delete: async (id: string) => {
    const res = await api.delete(`/courses/${id}`)
    return res.data
  },
}

// ============ Field ============
export const settingsFieldService = {
  create: async (data: { name: string; course: string; order: number }) => {
    const res = await api.post('/fields', data)
    return res.data
  },
  update: async (id: string, data: Partial<{ name: string; order: number }>) => {
    const res = await api.put(`/fields/${id}`, data)
    return res.data
  },
  delete: async (id: string) => {
    const res = await api.delete(`/fields/${id}`)
    return res.data
  },
}

// ============ Grade ============
export const settingsGradeService = {
  create: async (data: { name: string; course: string; field: string; order: number }) => {
    const res = await api.post('/grades', data)
    return res.data
  },
  update: async (id: string, data: Partial<{ name: string; order: number }>) => {
    const res = await api.put(`/grades/${id}`, data)
    return res.data
  },
  delete: async (id: string) => {
    const res = await api.delete(`/grades/${id}`)
    return res.data
  },
}

// ============ Book ============
export const settingsBookService = {
  create: async (data: { name: string; grade: string; order: number; icon: string }) => {
    const res = await api.post('/books', data)
    return res.data
  },
  update: async (id: string, data: Partial<{ name: string; order: number; icon: string }>) => {
    const res = await api.put(`/books/${id}`, data)
    return res.data
  },
  delete: async (id: string) => {
    const res = await api.delete(`/books/${id}`)
    return res.data
  },
}
