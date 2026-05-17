import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Login action
      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
        })
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        // Clear localStorage
        localStorage.removeItem('auth-storage')
      },

      // Update user profile
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }))
      },

      // Check if user has specific role
      hasRole: (role) => {
        const { user } = get()
        if (Array.isArray(role)) {
          return role.includes(user?.role)
        }
        return user?.role === role
      },

      // Get authorization header
      getAuthHeader: () => {
        const { token } = get()
        return token ? { Authorization: `Bearer ${token}` } : {}
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
)
