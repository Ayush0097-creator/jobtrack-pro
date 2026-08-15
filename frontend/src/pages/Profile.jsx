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
        college: user.college || '',
        branch: user.branch || '',
        roll_number: user.roll_number || '',
        graduation_year: user.graduation_year || '',
        cgpa: user.cgpa ?? '',
        backlogs: user.backlogs ?? 0,
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
              cgpa: v.cgpa !== '' && v.cgpa !== null ? parseFloat(v.cgpa) : null,
              graduation_year: v.graduation_year !== '' && v.graduation_year !== null ? parseInt(v.graduation_year) : null,
              backlogs: parseInt(v.backlogs) || 0,
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">College / Institution</label>
              <input className="input" placeholder="e.g. IIT / NIT / University" {...register('college')} />
            </div>
            <div>
              <label className="label">Branch / Department</label>
              <input className="input" placeholder="e.g. CSE, ECE, IT" {...register('branch')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Roll Number</label>
              <input className="input" placeholder="e.g. 21BCS045" {...register('roll_number')} />
            </div>
            <div>
              <label className="label">Graduation Year</label>
              <input className="input" type="number" placeholder="2025" {...register('graduation_year')} />
            </div>
            <div>
              <label className="label">CGPA / GPA</label>
              <input className="input" type="number" step="0.01" min="0" max="10" placeholder="8.5" {...register('cgpa')} />
            </div>
          </div>
          <div>
            <label className="label">Active Backlogs (0 = none)</label>
            <input className="input" type="number" min="0" {...register('backlogs')} />
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
            <label className="label">Education Notes</label>
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
