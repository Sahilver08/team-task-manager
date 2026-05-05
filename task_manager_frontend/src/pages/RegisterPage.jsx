import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as registerApi } from '../api/authApi'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm]     = useState({ email: '', full_name: '', password: '', confirm_password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    setApiError('')
  }

  const validate = () => {
    const errs = {}
    if (!form.full_name)        errs.full_name = 'Full name is required'
    if (!form.email)            errs.email     = 'Email is required'
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await registerApi(form)
      login(res.data.data)
      navigate('/dashboard')
    } catch (err) {
      // Show field-level errors from backend if available
      const fieldErrors = err.response?.data?.errors
      if (fieldErrors) {
        const flat = {}
        Object.entries(fieldErrors).forEach(([k, v]) => { flat[k] = Array.isArray(v) ? v[0] : v })
        setErrors(flat)
      } else {
        setApiError(err.response?.data?.message || 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-600/30">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">Start managing tasks with your team</p>
        </div>

        <div className="card p-6">
          {apiError && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              {apiError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input id="full_name" label="Full name" type="text" name="full_name"
              value={form.full_name} onChange={handleChange} error={errors.full_name}
              placeholder="Alice Smith" autoComplete="name" />
            <Input id="email" label="Email address" type="email" name="email"
              value={form.email} onChange={handleChange} error={errors.email}
              placeholder="you@company.com" autoComplete="email" />
            <Input id="password" label="Password" type="password" name="password"
              value={form.password} onChange={handleChange} error={errors.password}
              placeholder="Min. 8 characters" autoComplete="new-password" />
            <Input id="confirm_password" label="Confirm password" type="password" name="confirm_password"
              value={form.confirm_password} onChange={handleChange} error={errors.confirm_password}
              placeholder="••••••••" autoComplete="new-password" />
            <Button type="submit" loading={loading} className="w-full justify-center mt-2">
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
