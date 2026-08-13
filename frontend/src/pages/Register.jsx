import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Briefcase } from 'lucide-react'
import { useAuth } from '../api/auth'
import { errorMessage } from '../lib/utils'

export default function Register() {
  const { register: signup } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit } = useForm()

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      await signup(values)
      toast.success('Account created')
      navigate('/dashboard')
    } catch (err) {
      toast.error(errorMessage(err, 'Registration failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-fade px-4">
      <div className="glass-card w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Briefcase size={18} />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-white">Create account</p>
            <p className="text-sm text-mist-400">Start your placement tracker</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="label">Full name</label>
            <input className="input" required {...register('full_name')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required {...register('email')} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" minLength={8} required {...register('password')} />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input className="input" type="password" minLength={8} required {...register('password_confirm')} />
          </div>
          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-mist-400">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
