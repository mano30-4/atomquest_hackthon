import api from './api'

const approvalService = {
  // Get pending approvals for manager
  getPendingApprovals: async () => {
    const response = await api.get('/approvals/pending')
    return response.data
  },

  // Get team goals overview
  getTeamGoals: async (year) => {
    const response = await api.get('/approvals/team-overview', { params: { fiscalYear: year } })
    return response.data
  },

  // Approve goals
  approveGoals: async (goalSheetId, comment) => {
    const response = await api.post(`/approvals/${goalSheetId}/approve`, { comments: comment })
    return response.data
  },

  // Return goals for rework
  returnForRework: async (goalSheetId, comment) => {
    const response = await api.post(`/approvals/${goalSheetId}/return`, { comments: comment })
    return response.data
  },

  // Update goal during approval (inline editing)
  updateGoalInline: async (goalId, updates) => {
    const response = await api.put(`/approvals/goals/${goalId}`, updates)
    return response.data
  },

  // Get approval history
  getApprovalHistory: async (goalSheetId) => {
    const response = await api.get(`/approvals/${goalSheetId}/history`)
    return response.data
  },

  // Get team member details
  getTeamMemberGoals: async (userId, year) => {
    const response = await api.get(`/approvals/team/${userId}/goals`, { params: { year } })
    return response.data
  }
}

export default approvalService
