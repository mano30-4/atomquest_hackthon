import api from './api'

const checkinService = {
  // Get all check-ins for current user
  getMyCheckins: async (year) => {
    const response = await api.get('/checkins/quarter/Q1', { params: { year } })
    return response.data
  },

  // Create a check-in
  createCheckin: async (checkinData) => {
    const response = await api.post('/checkins', checkinData)
    return response.data
  },

  // Update a check-in
  updateCheckin: async (checkinId, checkinData) => {
    const response = await api.put(`/checkins/${checkinId}`, checkinData)
    return response.data
  },

  // Get check-in by ID
  getCheckinById: async (checkinId) => {
    const response = await api.get(`/checkins/${checkinId}`)
    return response.data
  },

  // Get check-ins for a specific goal
  getGoalCheckins: async (goalId) => {
    const response = await api.get(`/checkins/goal/${goalId}`)
    return response.data
  },

  // Add manager comment to check-in
  addComment: async (checkinId, comment) => {
    const response = await api.post(`/checkins/${checkinId}/comment`, { comment })
    return response.data
  },

  // Get team check-ins (for managers)
  getTeamCheckins: async (quarter, year) => {
    const response = await api.get('/checkins/team/summary', { params: { quarter, fiscalYear: year } })
    return response.data
  },

  // Get completion dashboard
  getCompletionDashboard: async (quarter, year) => {
    const response = await api.get('/checkins/dashboard/completion', { params: { quarter, fiscalYear: year } })
    return response.data
  },

  // Get current quarter window
  getCurrentWindow: async () => {
    const response = await api.get('/checkins/window/Q1')
    return response.data
  }
}

export default checkinService
