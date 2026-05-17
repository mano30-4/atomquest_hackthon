import api from './api'

const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

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
    return response
  },

  // Export report to Excel
  exportExcel: async (reportType, params) => {
    const response = await api.get(`/reports/export/${reportType}`, {
      params,
      responseType: 'blob'
    })
    return response
  },

  downloadAchievementCSV: async (params) => {
    const blob = await reportService.exportCSV('achievement', params)
    downloadFile(blob, 'achievement-report.csv')
  },

  downloadCompletionExcel: async (params) => {
    const blob = await reportService.exportExcel('completion', params)
    downloadFile(blob, 'completion-report.xlsx')
  },

  // Get audit logs
  getAuditLogs: async (filters) => {
    const response = await api.get('/reports/audit-logs', { params: filters })
    return response.data
  }
}

export default reportService
