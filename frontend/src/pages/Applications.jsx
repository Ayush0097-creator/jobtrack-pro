import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Search, X } from 'lucide-react'
import api from '../api/client'
import { PageHeader, EmptyState, Skeleton } from '../components/ui/Primitives'
import { SOURCES, STATUS_COLUMNS, WORK_TYPES, statusLabel } from '../lib/constants'
import { errorMessage } from '../lib/utils'

export default function Applications() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    source: '',
    ordering: '-updated_at',
  })
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { work_type: 'remote', source: 'linkedin', status: 'saved', currency: 'INR' },
  })

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.search) p.set('search', filters.search)
    if (filters.status) p.set('status', filters.status)
    if (filters.source) p.set('source', filters.source)
    if (filters.ordering) p.set('ordering', filters.ordering)
    return p.toString()
  }, [filters])

  const { data, isLoading } = useQuery({
    queryKey: ['applications', queryString],
    queryFn: async () => (await api.get(`/applications/?${queryString}`)).data,
  })

  const createMut = useMutation({
    mutationFn: (payload) => api.post('/applications/', payload),
    onSuccess: () => {
      toast.success('Application added')
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      setShowForm(false)
      reset()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/applications/${id}/`),
    onSuccess: () => {
      toast.success('Deleted')
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })

  const apps = data?.results || data || []

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle="Search, filter, and manage every opportunity"
        actions={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add application
          </button>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 text-mist-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search company or role"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <select
          className="input"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          {STATUS_COLUMNS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={filters.ordering}
          onChange={(e) => setFilters((f) => ({ ...f, ordering: e.target.value }))}
        >
          <option value="-updated_at">Newest</option>
          <option value="updated_at">Oldest</option>
          <option value="deadline">Deadline</option>
          <option value="-salary">Salary high</option>
          <option value="salary">Salary low</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : apps.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Add your first role to start building your placement pipeline."
          action={
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Add application
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div
              key={app.id}
              className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link to={`/app/applications/${app.id}`} className="font-display text-lg text-white hover:text-accent">
                  {app.job_title}
                </Link>
                <p className="text-sm text-mist-300">
                  {app.company_name} · {statusLabel(app.status)}
                  {app.location ? ` · ${app.location}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {app.match_score != null && (
                  <span className="rounded-lg bg-accent/15 px-2 py-1 font-mono text-xs text-accent">
                    {app.match_score}% match
                  </span>
                )}
                <Link to={`/app/applications/${app.id}`} className="btn-ghost">
                  Open
                </Link>
                <button className="btn-ghost text-red-300" onClick={() => deleteMut.mutate(app.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-white">New application</h2>
              <button onClick={() => setShowForm(false)} className="text-mist-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={handleSubmit((v) =>
                createMut.mutate({
                  ...v,
                  salary: v.salary ? Number(v.salary) : null,
                  application_date: v.application_date || null,
                  deadline: v.deadline || null,
                })
              )}
            >
              <div>
                <label className="label">Company</label>
                <input className="input" required {...register('company_name')} />
              </div>
              <div>
                <label className="label">Job title</label>
                <input className="input" required {...register('job_title')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Job URL</label>
                <input className="input" {...register('job_url')} />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" {...register('location')} />
              </div>
              <div>
                <label className="label">Work type</label>
                <select className="input" {...register('work_type')}>
                  {WORK_TYPES.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Salary</label>
                <input className="input" type="number" step="0.01" {...register('salary')} />
              </div>
              <div>
                <label className="label">Source</label>
                <select className="input" {...register('source')}>
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Applied on</label>
                <input className="input" type="date" {...register('application_date')} />
              </div>
              <div>
                <label className="label">Deadline</label>
                <input className="input" type="date" {...register('deadline')} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" {...register('status')}>
                  {STATUS_COLUMNS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Job description</label>
                <textarea className="input min-h-28" {...register('job_description')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Notes</label>
                <textarea className="input min-h-20" {...register('notes')} />
              </div>
              <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button className="btn-primary" disabled={createMut.isPending}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
