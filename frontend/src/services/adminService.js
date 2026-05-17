import api from './api'

const adminService = {
  // User Management
  getAllUsers: async (params) => {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData)
    return response.data
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData)
    return response.data
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
  },

  resetPassword: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/reset-password`)
    return response.data
  },

  // Thrust Area Management
  getAllThrustAreas: async () => {
    const response = await api.get('/admin/thrust-areas')
    return response.data
  },

  createThrustArea: async (thrustAreaData) => {
    const response = await api.post('/admin/thrust-areas', thrustAreaData)
    return response.data
  },

  updateThrustArea: async (thrustAreaId, thrustAreaData) => {
    const response = await api.put(`/admin/thrust-areas/${thrustAreaId}`, thrustAreaData)
    return response.data
  },

  deleteThrustArea: async (thrustAreaId) => {
    const response = await api.delete(`/admin/thrust-areas/${thrustAreaId}`)
    return response.data
  },

  // System Statistics
  getSystemStats: async () => {
    const response = await api.get('/admin/stats')
    return response.data
  },

  // Audit Logs
  getAuditLogs: async (filters) => {
    const response = await api.get('/admin/audit-logs', { params: filters })
    return response.data
  },

  // Goal Sheet Management
  getAllGoalSheets: async (params) => {
    const response = await api.get('/admin/goal-sheets', { params })
    return response.data
  },

  unlockGoalSheet: async (goalSheetId) => {
    const response = await api.post(`/admin/goal-sheets/${goalSheetId}/unlock`)
    return response.data
  },

  // Bulk Operations
  bulkApproveGoals: async (goalSheetIds) => {
    const response = await api.post('/admin/bulk-approve', { goalSheetIds })
    return response.data
  },

  // System Settings
  getSettings: async () => {
    const response = await api.get('/admin/settings')
    return response.data
  },

  updateSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings)
    return response.data
  }
}

export default adminService
