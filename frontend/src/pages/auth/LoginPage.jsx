import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import authService from '../../services/authService'
import toast from 'react-hot-toast'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authService.login(email, password)
      login(response.user, response.token)
      toast.success('Login successful!')
      
      // Redirect based on role
      if (response.user.role === 'admin') {
        navigate('/admin')
      } else if (response.user.role === 'manager') {
        navigate('/manager')
      } else {
        navigate('/employee')
      }
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.message

      if (status === 401) {
        toast.error('Invalid email or password')
      } else if (status === 403) {
        toast.error(message || 'This account is not active')
      } else {
        toast.error(message || 'Could not sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Goal Tracking Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input rounded-t-md rounded-b-none"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input rounded-b-md rounded-t-none"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Demo Credentials:</p>
          <p className="mt-1">Employee: employee1@atomquest.com / Password123!</p>
          <p>Manager: manager1@atomquest.com / Password123!</p>
          <p>Admin: admin@atomquest.com / Password123!</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
