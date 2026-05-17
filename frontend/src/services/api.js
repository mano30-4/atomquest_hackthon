import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const status = error.response?.status
    const requestUrl = error.config?.url || ''
    const isLoginRequest = requestUrl.includes('/auth/login')
    
    // Handle 401 Unauthorized - logout users only after they already have a session
    if (status === 401 && !isLoginRequest) {
      useAuthStore.getState().logout()
      toast.error('Session expired. Please login again.')
      window.location.href = '/login'
    }
    
    // Handle 403 Forbidden
    if (status === 403 && !isLoginRequest) {
      toast.error('You do not have permission to perform this action')
    }
    
    // Handle 404 Not Found
    if (status === 404) {
      toast.error('Resource not found')
    }
    
    // Handle 500 Server Error
    if (status >= 500) {
      toast.error('Server error. Please try again later.')
    }
    
    return Promise.reject(error)
  }
)

export default api
