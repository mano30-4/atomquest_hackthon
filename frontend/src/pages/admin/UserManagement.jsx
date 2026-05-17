import { useEffect, useMemo, useState } from 'react'
import { Plus, RotateCw, UserX } from 'lucide-react'
import toast from 'react-hot-toast'
import adminService from '../../services/adminService'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    role: 'employee',
    department: 'Sales',
    managerId: ''
  })

  const managers = useMemo(
    () => users.filter((user) => ['manager', 'admin'].includes(user.role) && user.isActive),
    [users]
  )

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await adminService.getAllUsers({ limit: 100 })
      setUsers(data.users || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    try {
      await adminService.createUser({
        ...form,
        managerId: form.managerId ? Number(form.managerId) : null
      })
      toast.success('User added')
      setIsOpen(false)
      setForm({
        name: '',
        email: '',
        password: 'Password123!',
        role: 'employee',
        department: 'Sales',
        managerId: ''
      })
      loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add user')
    }
  }

  const handleDeactivate = async (user) => {
    try {
      await adminService.deleteUser(user.id)
      toast.success(`${user.name} deactivated`)
      loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update user')
    }
  }

  const roleVariant = {
    admin: 'danger',
    manager: 'info',
    employee: 'success'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage system users and their roles
          </p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">People Directory</h2>
            <p className="text-sm text-gray-600">Demo users share one coherent reporting structure.</p>
          </div>
          <button onClick={loadUsers} className="btn btn-secondary btn-sm flex items-center gap-2">
            <RotateCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Manager</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={roleVariant[user.role] || 'default'}>{user.role}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.department || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.manager?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={user.isActive ? 'success' : 'default'}>
                        {user.isActive ? 'active' : 'inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeactivate(user)}
                        disabled={!user.isActive || user.role === 'admin'}
                        className="btn btn-secondary btn-sm inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <UserX className="h-4 w-4" />
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add User" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input type="email" className="input mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Role</span>
              <select className="input mt-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, managerId: '' })}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Department</span>
              <input className="input mt-1" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Manager</span>
              <select className="input mt-1" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} disabled={form.role !== 'employee'}>
                <option value="">No manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>{manager.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Temporary Password</span>
              <input className="input mt-1" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Add User</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default UserManagement
