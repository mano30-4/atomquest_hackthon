import { useEffect, useState } from 'react'
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import toast from 'react-hot-toast'
import approvalService from '../../services/approvalService'
import reportService from '../../services/reportService'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function ManagerReports() {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setTeam(await approvalService.getTeamGoals())
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load reports')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const data = team.map((member) => ({
    name: member.employeeName.split(' ')[0],
    goals: member.goalCount,
    weightage: Number(member.totalWeightage)
  }))

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
          <h1 className="text-3xl font-bold text-gray-900">Team Reports</h1>
          <p className="text-gray-600 mt-2">
            View team performance and achievement reports
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

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Team Goal Coverage</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="goals" fill="#2563eb" />
              <Bar dataKey="weightage" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default ManagerReports
