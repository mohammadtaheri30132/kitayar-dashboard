import axios from 'axios'

const API_BASE_URL = 'https://vasehkhoneh.ir/kitayar-api/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token')
      localStorage.removeItem('auth-user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api
