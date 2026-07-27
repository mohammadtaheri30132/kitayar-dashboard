import api from './api'

export interface LoginCredentials {
  username: string
  password: string
}

export interface UserData {
  id: string
  username: string
  fullName: string
  role: 'admin' | 'teacher'
  lastLogin: string | null
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: UserData
  }
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials)
    return response.data
  },

  getMe: async (): Promise<{ success: boolean; data: UserData }> => {
    const response = await api.get('/auth/me')
    return response.data
  },
}
