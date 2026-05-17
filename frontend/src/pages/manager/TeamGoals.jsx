import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import toast from 'react-hot-toast'
import approvalService from '../../services/approvalService'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function TeamGoals() {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setTeam(await approvalService.getTeamGoals())
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load team goals')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const variant = {
    approved: 'success',
    submitted: 'warning',
    returned: 'danger',
    draft: 'default',
    not_started: 'default'
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Goals</h1>
        <p className="text-gray-600 mt-2">
          View and manage your team members' goals
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Goals</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Weightage</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {team.map((member) => (
                  <tr key={member.employeeId}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{member.employeeName}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4"><Badge variant={variant[member.goalSheetStatus]}>{member.goalSheetStatus.replace('_', ' ')}</Badge></td>
                    <td className="px-6 py-4 text-sm text-gray-700">{member.goalCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{member.totalWeightage}%</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{member.submittedAt ? new Date(member.submittedAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {team.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No reporting employees found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamGoals
