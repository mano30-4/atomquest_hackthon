import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  Home,
  Target,
  CheckCircle,
  BarChart3,
  Users,
  Settings,
  FileText
} from 'lucide-react'

function Sidebar() {
  const { user } = useAuthStore()

  const employeeLinks = [
    { to: '/employee', icon: Home, label: 'Dashboard' },
    { to: '/employee/goals', icon: Target, label: 'My Goals' },
    { to: '/employee/checkins', icon: CheckCircle, label: 'Check-ins' },
    { to: '/employee/reports', icon: BarChart3, label: 'Reports' }
  ]

  const managerLinks = [
    { to: '/manager', icon: Home, label: 'Dashboard' },
    { to: '/manager/team', icon: Users, label: 'Team Goals' },
    { to: '/manager/approvals', icon: FileText, label: 'Approvals' },
    { to: '/manager/reports', icon: BarChart3, label: 'Reports' }
  ]

  const adminLinks = [
    { to: '/admin', icon: Home, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/thrust-areas', icon: Target, label: 'Thrust Areas' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' }
  ]

  const getLinks = () => {
    switch (user?.role) {
      case 'admin':
        return adminLinks
      case 'manager':
        return managerLinks
      default:
        return employeeLinks
    }
  }

  const links = getLinks()

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to.split('/').length === 2}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
