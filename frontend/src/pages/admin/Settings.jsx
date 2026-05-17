import { useEffect, useState } from 'react'
import { CalendarDays, Save, Settings as SettingsIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import adminService from '../../services/adminService'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function Settings() {
  const [settings, setSettings] = useState(null)
  const [draft, setDraft] = useState({ maxGoals: 8, minWeightage: 10, totalWeightage: 100 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminService.getSettings()
        setSettings(data)
        setDraft({
          maxGoals: 8,
          minWeightage: 10,
          totalWeightage: 100
        })
      } catch (error) {
        toast.error(error.response?.data?.message || 'Could not load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = (event) => {
    event.preventDefault()
    toast.success('Demo settings saved for this session')
  }

  if (loading) {
    return <LoadingSpinner className="py-16" />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure system-wide settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="mb-4 flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Fiscal Calendar</h2>
          </div>
          <p className="text-sm text-gray-600">Current fiscal year: <span className="font-medium text-gray-900">{settings?.currentFiscalYear}</span></p>
          <div className="mt-4 space-y-3">
            {Object.entries(settings?.quarters || {}).map(([quarter, value]) => (
              <div key={quarter} className="rounded-md border border-gray-200 p-3">
                <div className="font-medium text-gray-900">{quarter} - {value.name}</div>
                <div className="text-sm text-gray-600">{value.start} to {value.end}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="mb-4 flex items-center gap-3">
            <SettingsIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Goal Rules</h2>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Maximum goals per employee</span>
              <input type="number" className="input mt-1" value={draft.maxGoals} onChange={(e) => setDraft({ ...draft, maxGoals: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Minimum weightage per goal</span>
              <input type="number" className="input mt-1" value={draft.minWeightage} onChange={(e) => setDraft({ ...draft, minWeightage: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Total required weightage</span>
              <input type="number" className="input mt-1" value={draft.totalWeightage} onChange={(e) => setDraft({ ...draft, totalWeightage: e.target.value })} />
            </label>
          </div>
          <button type="submit" className="btn btn-primary mt-5 flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </form>
      </div>
    </div>
  )
}

export default Settings
