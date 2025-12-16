import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { toast } from '../components/ui/Toaster'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setEmailError(null)
    setPasswordError(null)

    try {
      const response = await authApi.login({ email, password })
      login(response.data.access_token, response.data.user)
      toast.success('Login successful!')
      navigate('/app')
    } catch (error: any) {
      const errorData = error.response?.data
      const errorCode = errorData?.error_code
      const errorMessage = errorData?.message || errorData?.detail || 'Login failed'

      if (errorCode === 'user_not_found') {
        setEmailError(errorMessage)
        toast.error('User not found')
      } else if (errorCode === 'wrong_password') {
        setPasswordError(errorMessage)
        toast.error('Incorrect password')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your AcneAI account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailError(null)
              }}
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                emailError
                  ? 'border-red-500 bg-red-50 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="your@email.com"
            />
            {emailError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span>
                <span>{emailError}</span>
              </p>
            )}
            {emailError && (
              <p className="mt-1 text-xs text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium underline">
                  Sign up here
                </Link>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordError(null)
              }}
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                passwordError
                  ? 'border-red-500 bg-red-50 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="••••••••"
            />
            {passwordError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span>
                <span>{passwordError}</span>
              </p>
            )}
            {passwordError && (
              <p className="mt-1 text-xs text-gray-600">
                Forgot your password? Please contact support or try again.
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

