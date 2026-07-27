import { create } from 'zustand'
import { authService } from '../services/authService'
import type { UserData, LoginCredentials } from '../services/authService'
import toast from 'react-hot-toast'

interface AuthState {
  user: UserData | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('auth-user') || 'null'),
  token: localStorage.getItem('auth-token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('auth-token'),

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true })
    try {
      const response = await authService.login(credentials)
      
      if (response.success) {
        const { token, user } = response.data
        localStorage.setItem('auth-token', token)
        localStorage.setItem('auth-user', JSON.stringify(user))
        
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
        
        toast.success(response.message || '✅ خوش آمدید')
        return true
      }
      
      return false
    } catch (error: any) {
      const message = error.response?.data?.message || '❌ خطا در ورود به سیستم'
      toast.error(message)
      set({ isLoading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('auth-user')
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    })
    toast.success('👋 خارج شدید')
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth-token')
    if (!token) {
      set({ isAuthenticated: false, user: null })
      return
    }

    try {
      const response = await authService.getMe()
      if (response.success) {
        set({
          user: response.data,
          isAuthenticated: true,
        })
        localStorage.setItem('auth-user', JSON.stringify(response.data))
      }
    } catch (error) {
      localStorage.removeItem('auth-token')
      localStorage.removeItem('auth-user')
      set({ isAuthenticated: false, user: null })
    }
  },
}))
