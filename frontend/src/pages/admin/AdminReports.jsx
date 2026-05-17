import { useEffect, useState } from 'react'
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import toast from 'react-hot-toast'
import reportService from '../../services/reportService'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function AdminReports() {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)
  const [goalStats, setGoalStats] = useState(null)
  const [distribution, setDistribution] = useState({})

  useEffect(() => {
    const load = async () => {
      try {
        const [stats, areas] = await Promise.all([
          reportService.getOrgStatistics(),
          reportService.getThrustAreaDistribution?.() || Promise.resolve({})
        ])
        setGoalStats(stats)
        setDistribution(areas)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load reports')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statusData = Object.entries(goalStats?.statusBreakdown || {}).map(([name, value]) => ({ name, value }))
  const areaData = Object.entries(distribution || {}).map(([name, value]) => ({ name, value }))
  const colors = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0891b2']

  const handleExport = async (type) => {
    setExporting(type)
    try {
      if (type === 'achievement') {
        await reportService.downloadAchievementCSV()
        toast.success('Achievement CSV downloaded')
      } else {
        await reportService.downloadCompletionExcel()
        toast.success('Completion Excel downloaded')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not download report')
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return <LoadingSpinner className="py-16" />
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
          <p className="text-gray-600 mt-2">
            View organization-wide reports and analytics
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => handleExport('achievement')}
            disabled={Boolean(exporting)}
            className="btn btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {exporting === 'achievement' ? 'Preparing CSV...' : 'Download CSV'}
          </button>
          <button
            onClick={() => handleExport('completion')}
            disabled={Boolean(exporting)}
            className="btn btn-secondary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exporting === 'completion' ? 'Preparing Excel...' : 'Download Excel'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Goal Sheet Status</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Goals by Thrust Area</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={areaData} dataKey="value" nameKey="name" outerRadius={110} label>
                  {areaData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminReports
