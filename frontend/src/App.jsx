import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layout Components
import Layout from './components/layout/Layout'
import PublicLayout from './components/layout/PublicLayout'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import Goals from './pages/employee/Goals'
import Checkins from './pages/employee/Checkins'
import Reports from './pages/employee/Reports'

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard'
import Approvals from './pages/manager/Approvals'
import TeamGoals from './pages/manager/TeamGoals'
import ManagerReports from './pages/manager/ManagerReports'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import AdminReports from './pages/admin/AdminReports'
import ThrustAreas from './pages/admin/ThrustAreas'
import Settings from './pages/admin/Settings'

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

// Public Route Component (redirect if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated) {
    // Redirect based on role
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />
    } else if (user?.role === 'manager') {
      return <Navigate to="/manager" replace />
    } else {
      return <Navigate to="/employee" replace />
    }
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
      </Route>

      {/* Protected Routes */}
      <Route element={<Layout />}>
        {/* Employee Routes */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/goals"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <Goals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/checkins"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <Checkins />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/reports"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/approvals"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <Approvals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/team"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <TeamGoals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/reports"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerReports />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/thrust-areas"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ThrustAreas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">404 - Page Not Found</h1></div>} />
    </Routes>
  )
}

export default App
