import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../api/client'
import { useAuth } from '../api/auth'
import { PageHeader } from '../components/ui/Primitives'
import { errorMessage } from '../lib/utils'

export default function Profile() {
  const { user, refreshProfile } = useAuth()
  const { register, handleSubmit, reset } = useForm()
  const { register: regPw, handleSubmit: handlePw, reset: resetPw } = useForm()

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || '',
        phone: user.phone || '',
        linkedin_url: user.linkedin_url || '',
        github_url: user.github_url || '',
        portfolio_url: user.portfolio_url || '',
        education: user.education || '',
        skills: (user.skills || []).join(', '),
      })
    }
  }, [user, reset])

  const saveMut = useMutation({
    mutationFn: (payload) => api.patch('/auth/profile/', payload),
    onSuccess: async () => {
      await refreshProfile()
      toast.success('Profile updated')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const pwMut = useMutation({
    mutationFn: (payload) => api.post('/auth/change-password/', payload),
    onSuccess: () => {
      toast.success('Password changed')
      resetPw()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your placement identity and account security" />
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="glass-card space-y-3 p-5"
          onSubmit={handleSubmit((v) =>
            saveMut.mutate({
              ...v,
              skills: v.skills
                ? v.skills.split(',').map((s) => s.trim()).filter(Boolean)
                : [],
            })
          )}
        >
          <div>
            <label className="label">Full name</label>
            <input className="input" {...register('full_name')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} />
          </div>
          <div>
            <label className="label">LinkedIn</label>
            <input className="input" {...register('linkedin_url')} />
          </div>
          <div>
            <label className="label">GitHub</label>
            <input className="input" {...register('github_url')} />
          </div>
          <div>
            <label className="label">Portfolio</label>
            <input className="input" {...register('portfolio_url')} />
          </div>
          <div>
            <label className="label">Education</label>
            <textarea className="input" {...register('education')} />
          </div>
          <div>
            <label className="label">Skills (comma separated)</label>
            <input className="input" {...register('skills')} />
          </div>
          <button className="btn-primary" disabled={saveMut.isPending}>
            Save profile
          </button>
        </form>

        <form
          className="glass-card h-fit space-y-3 p-5"
          onSubmit={handlePw((v) => pwMut.mutate(v))}
        >
          <p className="font-display text-lg text-white">Change password</p>
          <div>
            <label className="label">Current password</label>
            <input className="input" type="password" required {...regPw('old_password')} />
          </div>
          <div>
            <label className="label">New password</label>
            <input className="input" type="password" minLength={8} required {...regPw('new_password')} />
          </div>
          <button className="btn-primary" disabled={pwMut.isPending}>
            Update password
          </button>
        </form>
      </div>
    </div>
  )
}
