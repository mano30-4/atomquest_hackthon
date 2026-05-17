import { useEffect, useState } from 'react'
import { CheckCircle, FileText, Undo2 } from 'lucide-react'
import toast from 'react-hot-toast'
import approvalService from '../../services/approvalService'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function Approvals() {
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)

  const loadApprovals = async () => {
    setLoading(true)
    try {
      setApprovals(await approvalService.getPendingApprovals())
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load approvals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApprovals()
  }, [])

  const approve = async (sheet) => {
    try {
      await approvalService.approveGoals(sheet.id, 'Approved after manager review.')
      toast.success('Goal sheet approved')
      loadApprovals()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not approve goals')
    }
  }

  const returnSheet = async (sheet) => {
    try {
      await approvalService.returnForRework(sheet.id, 'Please rebalance targets and clarify measurable outcomes.')
      toast.success('Returned for rework')
      loadApprovals()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not return goals')
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-600 mt-2">
          Review and approve team members' goals
        </p>
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : approvals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending approvals</h3>
          <p className="text-gray-600">All submitted goal sheets have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {approvals.map((sheet) => (
            <div key={sheet.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">{sheet.employee?.name}</h2>
                    <Badge variant="warning">submitted</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{sheet.employee?.department} • {sheet.fiscalYear}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => returnSheet(sheet)} className="btn btn-secondary flex items-center gap-2">
                    <Undo2 className="h-4 w-4" />
                    Return
                  </button>
                  <button onClick={() => approve(sheet)} className="btn btn-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                </div>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Goal</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Thrust Area</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Target</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(sheet.goals || []).map((goal) => (
                      <tr key={goal.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{goal.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{goal.thrustArea}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{goal.target}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{goal.weightage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Approvals
