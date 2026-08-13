import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/client'
import { PageHeader, Skeleton } from '../components/ui/Primitives'
import { SOURCES, STATUS_COLUMNS, WORK_TYPES, statusLabel } from '../lib/constants'
import { errorMessage } from '../lib/utils'

export default function ApplicationDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const { data: app, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => (await api.get(`/applications/${id}/`)).data,
  })
  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => (await api.get('/resumes/')).data,
  })
  const resumeList = resumes?.results || resumes || []
  const { register, handleSubmit } = useForm()

  const saveMut = useMutation({
    mutationFn: (payload) => api.patch(`/applications/${id}/`, payload),
    onSuccess: (res) => {
      toast.success('Saved')
      qc.setQueryData(['application', id], res.data)
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const matchMut = useMutation({
    mutationFn: () =>
      api.post('/ai/job-match/', {
        application_id: Number(id),
        job_description: app.job_description,
        resume_id: app.resume,
      }),
    onSuccess: () => {
      toast.success('Match score updated')
      qc.invalidateQueries({ queryKey: ['application', id] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (isLoading || !app) return <Skeleton className="h-64" />

  return (
    <div>
      <PageHeader
        title={app.job_title}
        subtitle={`${app.company_name} · ${statusLabel(app.status)}`}
        actions={
          <>
            <Link to="/app/applications" className="btn-ghost">
              Back
            </Link>
            <button className="btn-primary" onClick={() => matchMut.mutate()} disabled={matchMut.isPending}>
              Run AI match
            </button>
          </>
        }
      />

      {app.job_match && (
        <div className="glass-card mb-6 grid gap-4 p-5 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-mist-400">Match score</p>
            <p className="font-display text-4xl text-accent">{app.job_match.score}%</p>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase text-mist-400">Matched</p>
            <div className="flex flex-wrap gap-1">
              {(app.job_match.matched_skills || []).map((s) => (
                <span key={s} className="rounded-md bg-accent/15 px-2 py-0.5 text-xs text-accent">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase text-mist-400">Missing</p>
            <div className="flex flex-wrap gap-1">
              {(app.job_match.missing_skills || []).map((s) => (
                <span key={s} className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <form
        className="grid gap-4 lg:grid-cols-2"
        onSubmit={handleSubmit((v) =>
          saveMut.mutate({
            ...v,
            salary: v.salary ? Number(v.salary) : null,
            resume: v.resume || null,
            application_date: v.application_date || null,
            deadline: v.deadline || null,
          })
        )}
      >
        <div className="glass-card space-y-3 p-5">
          <div>
            <label className="label">Company</label>
            <input className="input" defaultValue={app.company_name} {...register('company_name')} />
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" defaultValue={app.job_title} {...register('job_title')} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" defaultValue={app.status} {...register('status')}>
              {STATUS_COLUMNS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Source</label>
            <select className="input" defaultValue={app.source} {...register('source')}>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Work type</label>
            <select className="input" defaultValue={app.work_type} {...register('work_type')}>
              {WORK_TYPES.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Resume used</label>
            <select className="input" defaultValue={app.resume || ''} {...register('resume')}>
              <option value="">None</option>
              {resumeList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} v{r.version}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" defaultValue={app.location || ''} {...register('location')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Salary</label>
              <input className="input" type="number" defaultValue={app.salary || ''} {...register('salary')} />
            </div>
            <div>
              <label className="label">Deadline</label>
              <input className="input" type="date" defaultValue={app.deadline || ''} {...register('deadline')} />
            </div>
          </div>
          <div>
            <label className="label">Job description</label>
            <textarea className="input min-h-32" defaultValue={app.job_description || ''} {...register('job_description')} />
          </div>
        </div>

        <div className="glass-card space-y-3 p-5">
          <p className="font-display text-lg text-white">Interview knowledge base</p>
          <div>
            <label className="label">Interview questions</label>
            <textarea className="input min-h-24" defaultValue={app.interview_questions || ''} {...register('interview_questions')} />
          </div>
          <div>
            <label className="label">DSA questions</label>
            <textarea className="input min-h-24" defaultValue={app.dsa_questions || ''} {...register('dsa_questions')} />
          </div>
          <div>
            <label className="label">HR questions</label>
            <textarea className="input min-h-24" defaultValue={app.hr_questions || ''} {...register('hr_questions')} />
          </div>
          <div>
            <label className="label">Personal notes</label>
            <textarea className="input min-h-24" defaultValue={app.personal_notes || ''} {...register('personal_notes')} />
          </div>
          <button className="btn-primary" disabled={saveMut.isPending}>
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}
