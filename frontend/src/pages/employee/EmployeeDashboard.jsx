import { useEffect, useState } from 'react'
import { Target, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import goalService from '../../services/goalService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'

function EmployeeDashboard() {
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setSheet(await goalService.getMyGoalSheet())
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

  const goals = sheet?.goals || []
  const completed = goals.filter((goal) => goal.status === 'completed').length
  const inProgress = goals.filter((goal) => goal.status === 'on_track').length

  const statCards = [
    {
      title: 'Total Goals',
      value: goals.length,
      icon: Target,
      color: 'bg-blue-500'
    },
    {
      title: 'Completed',
      value: completed,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'In Progress',
      value: inProgress,
      icon: TrendingUp,
      color: 'bg-yellow-500'
    },
    {
      title: 'Pending Approval',
      value: sheet?.status === 'submitted' ? 1 : 0,
      icon: AlertCircle,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's an overview of your goals.
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
            Recent Goals
          </h2>
          <div className="space-y-3">
            {goals.slice(0, 4).map((goal) => (
              <div key={goal.id} className="rounded-md border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-gray-900">{goal.title}</p>
                  <Badge variant={goal.status === 'completed' ? 'success' : 'info'}>{goal.status.replace('_', ' ')}</Badge>
                </div>
                <p className="mt-1 text-sm text-gray-600">{goal.thrustArea} • {goal.weightage}%</p>
              </div>
            ))}
            {goals.length === 0 && <p className="text-gray-500">No goals yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Check-ins
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Goal sheet status</p>
            <Badge variant={sheet?.status === 'approved' ? 'success' : sheet?.status === 'submitted' ? 'warning' : 'default'}>
              {sheet?.status || 'not started'}
            </Badge>
            <p className="pt-3 text-sm text-gray-600">Q1 check-ins use the same approved goals shown in My Goals.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDashboard
