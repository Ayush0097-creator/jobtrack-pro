import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { GraduationCap } from 'lucide-react'
import { useAuth } from '../api/auth'
import { errorMessage } from '../lib/utils'

export default function StudentLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit } = useForm()

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const profile = await login(values.email, values.password, { portal: 'student' })
      toast.success('Welcome back')
      if (profile?.is_admin || profile?.role === 'admin' || profile?.is_staff) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate(location.state?.from?.pathname || '/app/dashboard', { replace: true })
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Login failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-fade px-4">
      <div className="glass-card w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-white">Student sign in</p>
            <p className="text-sm text-mist-400">JobTrack Pro · Student Portal</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required {...register('email')} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required {...register('password')} />
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Enter student portal'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-mist-400">
          New student?{' '}
          <Link to="/student/register" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-mist-400">
          Administrator?{' '}
          <Link to="/admin/login" className="text-sky-400 hover:underline">
            Admin console
          </Link>
        </p>
      </div>
    </div>
  )
}
