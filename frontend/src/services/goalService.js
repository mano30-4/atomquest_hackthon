import api from './api'

const goalService = {
  // Get all goals for current user
  getMyGoals: async (year) => {
    const response = await api.get('/goals/my-goals', { params: { year } })
    return response.data
  },

  // Get goal sheet for current user
  getMyGoalSheet: async (year) => {
    const response = await api.get('/goals/my-goal-sheet', { params: { year } })
    return response.data
  },

  // Create a new goal
  createGoal: async (goalData) => {
    const response = await api.post('/goals', goalData)
    return response.data
  },

  saveMyGoals: async (payload) => {
    const response = await api.put('/goals/my-goals', payload)
    return response.data
  },

  // Update a goal
  updateGoal: async (goalId, goalData) => {
    const response = await api.put(`/goals/${goalId}`, goalData)
    return response.data
  },

  // Delete a goal
  deleteGoal: async (goalId) => {
    const response = await api.delete(`/goals/${goalId}`)
    return response.data
  },

  // Submit goals for approval
  submitGoals: async (goalSheetId) => {
    const response = await api.post(`/goals/sheets/${goalSheetId}/submit`)
    return response.data
  },

  // Get goal by ID
  getGoalById: async (goalId) => {
    const response = await api.get(`/goals/${goalId}`)
    return response.data
  },

  // Get shared goals
  getSharedGoals: async () => {
    const response = await api.get('/goals/shared')
    return response.data
  },

  // Add shared goal member
  addSharedMember: async (goalId, userId) => {
    const response = await api.post(`/goals/${goalId}/share`, { employeeIds: [userId] })
    return response.data
  },

  // Remove shared goal member
  removeSharedMember: async (goalId, userId) => {
    const response = await api.delete(`/goals/${goalId}/shared-members/${userId}`)
    return response.data
  },

  // Get thrust areas
  getThrustAreas: async () => {
    const response = await api.get('/goals/thrust-areas')
    return response.data
  }
}

export default goalService
