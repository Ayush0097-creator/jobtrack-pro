import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Shield } from 'lucide-react'
import { useAuth, homeForUser, isAdminUser } from '../api/auth'
import { errorMessage } from '../lib/utils'

export default function AdminLogin() {
  const { login, isAuthenticated, loading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit } = useForm()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(homeForUser(user), { replace: true })
    }
  }, [loading, isAuthenticated, user, navigate])

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      await login(values.email, values.password, { portal: 'admin' })
      toast.success('Admin console unlocked')
      navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true })
    } catch (err) {
      toast.error(errorMessage(err, 'Admin login failed — staff credentials required'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || (isAuthenticated && isAdminUser(user))) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06080d] px-4">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 50% 0%, rgba(91,141,239,0.2), transparent)',
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-sky-500/20 bg-[#0c1220]/90 p-8 shadow-glass backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
            <Shield size={18} />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-white">Admin sign in</p>
            <p className="text-sm text-mist-400">JobTrack Pro · Admin Console</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="label">Admin email</label>
            <input className="input" type="email" required {...register('email')} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required {...register('password')} />
          </div>
          <button
            className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-ink-950 hover:bg-sky-400 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Verifying…' : 'Enter admin console'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-mist-400">
          Student looking for the tracker?{' '}
          <Link to="/student/login" className="text-accent hover:underline">
            Student portal
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-mist-500">
          Create an admin with <code className="text-mist-300">python manage.py createsuperuser</code>
        </p>
      </div>
    </div>
  )
}
