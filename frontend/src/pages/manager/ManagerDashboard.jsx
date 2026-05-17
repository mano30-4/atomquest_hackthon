import { useEffect, useState } from 'react'
import { Users, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import approvalService from '../../services/approvalService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'

function ManagerDashboard() {
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState([])
  const [pending, setPending] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [teamData, pendingData] = await Promise.all([
          approvalService.getTeamGoals(),
          approvalService.getPendingApprovals()
        ])
        setTeam(teamData || [])
        setPending(pendingData || [])
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load manager dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <LoadingSpinner className="py-16" />
  }

  const approved = team.filter((member) => member.goalSheetStatus === 'approved').length

  const statCards = [
    {
      title: 'Team Members',
      value: team.length,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Approvals',
      value: pending.length,
      icon: FileText,
      color: 'bg-orange-500'
    },
    {
      title: 'Approved Sheets',
      value: approved,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Upcoming Check-ins',
      value: approved,
      icon: AlertCircle,
      color: 'bg-purple-500'
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your team's goals and performance
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
            Pending Approvals
          </h2>
          <div className="space-y-3">
            {pending.slice(0, 3).map((sheet) => (
              <div key={sheet.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                <span className="font-medium text-gray-900">{sheet.employee?.name}</span>
                <Badge variant="warning">{sheet.goals?.length || 0} goals</Badge>
              </div>
            ))}
            {pending.length === 0 && <p className="text-gray-500">No pending approvals.</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Team Performance
          </h2>
          <div className="space-y-3">
            {team.map((member) => (
              <div key={member.employeeId}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{member.employeeName}</span>
                  <span>{member.totalWeightage}%</span>
                </div>
                <div className="h-2 rounded bg-gray-100">
                  <div className="h-2 rounded bg-primary-600" style={{ width: `${Math.min(member.totalWeightage, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagerDashboard
