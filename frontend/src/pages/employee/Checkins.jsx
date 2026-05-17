import { useEffect, useState } from 'react'
import { CheckCircle, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import checkinService from '../../services/checkinService'
import goalService from '../../services/goalService'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function Checkins() {
  const [sheet, setSheet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const goalSheet = await goalService.getMyGoalSheet()
      setSheet(goalSheet)
      const nextDrafts = {}
      ;(goalSheet?.goals || []).forEach((goal) => {
        const q1 = goal.checkins?.find((checkin) => checkin.quarter === 'Q1')
        nextDrafts[goal.id] = {
          achievement: q1?.actualAchievement || '',
          status: q1?.status || 'on_track'
        }
      })
      setDrafts(nextDrafts)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load check-ins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const saveCheckin = async (goal) => {
    const draft = drafts[goal.id]
    try {
      await checkinService.createCheckin({
        goalId: goal.id,
        quarter: 'Q1',
        achievement: draft.achievement,
        status: draft.status
      })
      toast.success('Check-in saved')
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save check-in')
    }
  }

  if (loading) {
    return <LoadingSpinner className="py-16" />
  }

  const goals = sheet?.goals || []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Check-ins</h1>
        <p className="text-gray-600 mt-2">
          Track your quarterly progress and updates
        </p>
      </div>

      {sheet?.status !== 'approved' ? (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Check-ins open after approval</h3>
          <p className="text-gray-600">Your current goal sheet is {sheet?.status || 'not started'}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Q1 Progress</h2>
            <p className="text-sm text-gray-600">Update achievements against the same approved goals your manager sees.</p>
          </div>
          <div className="divide-y divide-gray-200">
            {goals.map((goal) => {
              const q1 = goal.checkins?.find((checkin) => checkin.quarter === 'Q1')
              return (
                <div key={goal.id} className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-5">
                    <p className="font-medium text-gray-900">{goal.title}</p>
                    <p className="text-sm text-gray-600">{goal.thrustArea} • target {goal.target}</p>
                  </div>
                  <div className="lg:col-span-2">
                    <Badge variant={q1 ? 'success' : 'warning'}>{q1 ? `${Math.round(Number(q1.progress || 0))}%` : 'pending'}</Badge>
                  </div>
                  <div className="lg:col-span-2">
                    <input className="input" placeholder="Achievement" value={drafts[goal.id]?.achievement || ''} onChange={(e) => setDrafts({ ...drafts, [goal.id]: { ...drafts[goal.id], achievement: e.target.value } })} />
                  </div>
                  <div className="lg:col-span-2">
                    <select className="input" value={drafts[goal.id]?.status || 'on_track'} onChange={(e) => setDrafts({ ...drafts, [goal.id]: { ...drafts[goal.id], status: e.target.value } })}>
                      <option value="not_started">Not started</option>
                      <option value="on_track">On track</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="lg:col-span-1">
                    <button onClick={() => saveCheckin(goal)} className="btn btn-primary btn-sm">
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Checkins
