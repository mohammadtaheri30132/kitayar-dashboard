import api from './api'

export interface DashboardStats {
  teachers: number
  students: number
  questions: {
    total: number
    recent: number
    byType: Record<string, number>
    byCourse: { name: string; code: string; count: number }[]
  }
  activities: {
    text: string
    user: string
    time: string
    questionId: string
  }[]
}

export interface DashboardResponse {
  success: boolean
  data: DashboardStats
}

export const dashboardService = {
  getStats: async (): Promise<DashboardResponse> => {
    const response = await api.get<DashboardResponse>('/dashboard')
    return response.data
  },
}
