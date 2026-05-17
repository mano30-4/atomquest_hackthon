import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import adminService from '../../services/adminService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'

function ThrustAreas() {
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const loadAreas = async () => {
    setLoading(true)
    try {
      setAreas(await adminService.getAllThrustAreas())
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load thrust areas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAreas()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    try {
      await adminService.createThrustArea(form)
      toast.success('Thrust area added')
      setIsOpen(false)
      setForm({ name: '', description: '' })
      loadAreas()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add thrust area')
    }
  }

  const handleDelete = async (area) => {
    try {
      await adminService.deleteThrustArea(area.id)
      toast.success('Thrust area deleted')
      loadAreas()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete thrust area')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thrust Areas</h1>
          <p className="text-gray-600 mt-2">
            Manage goal categories and thrust areas
          </p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Thrust Area</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading ? (
          <LoadingSpinner className="py-12 lg:col-span-2" />
        ) : (
          areas.map((area) => (
            <div key={area.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{area.name}</h2>
                  <p className="mt-2 text-sm text-gray-600">{area.description || 'No description'}</p>
                </div>
                <button onClick={() => handleDelete(area)} className="btn btn-secondary btn-sm">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Thrust Area">
        <form onSubmit={handleCreate} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Description</span>
            <textarea className="input mt-1 min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Add Area</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ThrustAreas
