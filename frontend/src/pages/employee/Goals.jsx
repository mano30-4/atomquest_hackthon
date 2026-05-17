import { useEffect, useMemo, useState } from 'react'
import { Plus, Send, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import goalService from '../../services/goalService'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'

function Goals() {
  const [sheet, setSheet] = useState(null)
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({
    thrustArea: 'Revenue Growth',
    title: '',
    description: '',
    uom: 'numeric_min',
    target: '',
    weightage: 10
  })

  const goals = sheet?.goals || []
  const totalWeightage = useMemo(
    () => goals.reduce((sum, goal) => sum + Number(goal.weightage || 0), 0),
    [goals]
  )

  const load = async () => {
    setLoading(true)
    try {
      const [goalSheet, thrustAreas] = await Promise.all([
        goalService.getMyGoalSheet(),
        goalService.getThrustAreas()
      ])
      setSheet(goalSheet)
      setAreas(thrustAreas)
      if (thrustAreas[0]) {
        setForm((current) => ({ ...current, thrustArea: current.thrustArea || thrustAreas[0].name }))
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load goals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const editable = !sheet || ['draft', 'returned'].includes(sheet.status)

  const saveGoals = async (nextGoals) => {
    const response = await goalService.saveMyGoals({ goals: nextGoals })
    setSheet(response.goalSheet ? { ...response.goalSheet, goals: response.goals } : response)
  }

  const handleAdd = async (event) => {
    event.preventDefault()
    try {
      await saveGoals([...goals, form])
      toast.success('Goal added')
      setIsOpen(false)
      setForm({ ...form, title: '', description: '', target: '', weightage: 10 })
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save goal')
    }
  }

  const handleSubmit = async () => {
    if (!sheet) return
    if (Number(totalWeightage) !== 100) {
      toast.error('Total weightage must equal 100% before submission')
      return
    }
    try {
      await goalService.submitGoals(sheet.id)
      toast.success('Goals submitted for approval')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit goals')
    }
  }

  if (loading) {
    return <LoadingSpinner className="py-16" />
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Goals</h1>
          <p className="text-gray-600 mt-2">
            Manage your annual goals and track progress
          </p>
        </div>
        <button disabled={!editable} onClick={() => setIsOpen(true)} className="btn btn-primary flex items-center space-x-2 disabled:cursor-not-allowed disabled:opacity-50">
          <Plus className="w-5 h-5" />
          <span>Add Goal</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No goals yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start by creating your first goal for this year
          </p>
          <button onClick={() => setIsOpen(true)} className="btn btn-primary">Create Your First Goal</button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Goal Sheet</h2>
              <p className="text-sm text-gray-600">Weightage total: {totalWeightage}%</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={sheet?.status === 'approved' ? 'success' : sheet?.status === 'submitted' ? 'warning' : 'default'}>
                {sheet?.status || 'draft'}
              </Badge>
              <button disabled={!editable || totalWeightage !== 100} onClick={handleSubmit} className="btn btn-success btn-sm flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                <Send className="h-4 w-4" />
                Submit
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Goal</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">UoM</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {goals.map((goal) => (
                  <tr key={goal.id || goal.title}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{goal.title}</div>
                      <div className="text-sm text-gray-500">{goal.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{goal.thrustArea}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{goal.uom}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{goal.target}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{goal.weightage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Goal" size="lg">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Title</span>
              <input className="input mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Thrust Area</span>
              <select className="input mt-1" value={form.thrustArea} onChange={(e) => setForm({ ...form, thrustArea: e.target.value })}>
                {areas.map((area) => <option key={area.id} value={area.name}>{area.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Measurement</span>
              <select className="input mt-1" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })}>
                <option value="numeric_min">Number, higher is better</option>
                <option value="numeric_max">Number, lower is better</option>
                <option value="percentage_min">Percentage, higher is better</option>
                <option value="percentage_max">Percentage, lower is better</option>
                <option value="timeline">Timeline</option>
                <option value="zero">Zero tolerance</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Target</span>
              <input className="input mt-1" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Weightage</span>
              <input type="number" min="10" max="100" className="input mt-1" value={form.weightage} onChange={(e) => setForm({ ...form, weightage: Number(e.target.value) })} required />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea className="input mt-1 min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Goal</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Goals
