import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/client'
import { errorMessage } from '../lib/utils'

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm()
  const [done, setDone] = useState(false)

  const onSubmit = async (values) => {
    try {
      await api.post('/auth/password-reset/', values)
      setDone(true)
      toast.success('Check your email (or server console in DEBUG)')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-fade px-4">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="font-display text-2xl text-white">Reset password</h1>
        {done ? (
          <p className="mt-4 text-sm text-mist-300">If that email exists, a reset link was sent.</p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required {...register('email')} />
            </div>
            <button className="btn-primary w-full">Send reset link</button>
          </form>
        )}
        <Link to="/student/login" className="mt-6 block text-center text-sm text-accent">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
