import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/client'
import { errorMessage } from '../lib/utils'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const { register, handleSubmit } = useForm({ defaultValues: { token } })
  const [done, setDone] = useState(false)

  const onSubmit = async (values) => {
    try {
      await api.post('/auth/password-reset/confirm/', values)
      setDone(true)
      toast.success('Password updated')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-fade px-4">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="font-display text-2xl text-white">Choose a new password</h1>
        {done ? (
          <p className="mt-4 text-sm text-mist-300">
            Done.{' '}
            <Link className="text-accent" to="/student/login">
              Sign in
            </Link>
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register('token')} />
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" minLength={8} required {...register('new_password')} />
            </div>
            <button className="btn-primary w-full">Update password</button>
          </form>
        )}
      </div>
    </div>
  )
}
