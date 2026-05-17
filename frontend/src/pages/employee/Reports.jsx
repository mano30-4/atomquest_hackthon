import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import toast from 'react-hot-toast'
import goalService from '../../services/goalService'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function Reports() {
  const [sheet, setSheet] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setSheet(await goalService.getMyGoalSheet())
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load reports')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <LoadingSpinner className="py-16" />
  }

  const data = (sheet?.goals || []).map((goal) => {
    const q1 = goal.checkins?.find((checkin) => checkin.quarter === 'Q1')
    return {
      name: goal.title.split(' ').slice(0, 2).join(' '),
      progress: Number(q1?.progress || 0),
      weight: Number(goal.weightage || 0)
    }
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">
          View your goal achievement and progress reports
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Q1 Goal Progress</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="progress" fill="#2563eb" />
              <Bar dataKey="weight" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Reports
