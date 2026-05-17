import { useEffect, useState } from 'react'
import { Activity, CheckCircle, Target, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import adminService from '../../services/adminService'
import approvalService from '../../services/approvalService'
import reportService from '../../services/reportService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'

function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [goalStats, setGoalStats] = useState(null)
  const [pending, setPending] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [systemStats, goals, pendingApprovals] = await Promise.all([
          adminService.getSystemStats(),
          reportService.getOrgStatistics(),
          approvalService.getPendingApprovals()
        ])
        setStats(systemStats)
        setGoalStats(goals)
        setPending(pendingApprovals || [])
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <LoadingSpinner className="py-16" />
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Goals',
      value: stats?.goals || 0,
      icon: Target,
      color: 'bg-green-500'
    },
    {
      title: 'Pending Reviews',
      value: pending.length,
      icon: Activity,
      color: 'bg-purple-500'
    },
    {
      title: 'Approved Sheets',
      value: goalStats?.statusBreakdown?.approved || 0,
      icon: CheckCircle,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          System overview and management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {pending.slice(0, 4).map((sheet) => (
              <div key={sheet.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                <div>
                  <p className="font-medium text-gray-900">{sheet.employee?.name}</p>
                  <p className="text-sm text-gray-500">{sheet.goals?.length || 0} goals submitted</p>
                </div>
                <Badge variant="warning">pending</Badge>
              </div>
            ))}
            {pending.length === 0 && <p className="text-gray-500">No submitted goal sheets waiting right now.</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            System Status
          </h2>
          <div className="space-y-3">
            {Object.entries(goalStats?.statusBreakdown || {}).map(([status, value]) => (
              <div key={status}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize text-gray-700">{status}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
                <div className="h-2 rounded bg-gray-100">
                  <div
                    className="h-2 rounded bg-primary-600"
                    style={{ width: `${goalStats.totalEmployees ? (value / goalStats.totalEmployees) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
