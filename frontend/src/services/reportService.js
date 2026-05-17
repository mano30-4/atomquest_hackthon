import api from './api'

const reportService = {
  // Get achievement report
  getAchievementReport: async (userId, year) => {
    const response = await api.get('/reports/achievement', { params: { userId, year } })
    return response.data
  },

  // Get completion dashboard
  getCompletionDashboard: async (quarter, year) => {
    const response = await api.get('/reports/completion-dashboard', { params: { quarter, year } })
    return response.data
  },

  // Get team statistics (for managers)
  getTeamStatistics: async (year) => {
    const response = await api.get('/reports/stats/goals', { params: { fiscalYear: year } })
    return response.data
  },

  // Get organization statistics (for admins)
  getOrgStatistics: async (year) => {
    const response = await api.get('/reports/stats/goals', { params: { fiscalYear: year } })
    return response.data
  },

  getThrustAreaDistribution: async (year) => {
    const response = await api.get('/reports/stats/thrust-areas', { params: { fiscalYear: year } })
    return response.data
  },

  // Export report to CSV
  exportCSV: async (reportType, params) => {
    const response = await api.get(`/reports/export/${reportType}`, { 
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // Export report to Excel
  exportExcel: async (reportType, params) => {
    const response = await api.get(`/reports/export/${reportType}`, { 
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // Get audit logs
  getAuditLogs: async (filters) => {
    const response = await api.get('/reports/audit-logs', { params: filters })
    return response.data
  }
}

export default reportService
