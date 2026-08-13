import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { Plus, X } from 'lucide-react'
import api from '../api/client'
import { PageHeader, EmptyState, Skeleton } from '../components/ui/Primitives'
import { errorMessage } from '../lib/utils'

const ROUNDS = [
  { value: 'oa', label: 'Online Assessment' },
  { value: 'r1', label: 'Round 1' },
  { value: 'r2', label: 'Round 2' },
  { value: 'r3', label: 'Round 3' },
  { value: 'hr', label: 'HR' },
  { value: 'managerial', label: 'Managerial' },
  { value: 'final', label: 'Final' },
]

export default function Interviews() {
  const qc = useQueryClient()
  const [show, setShow] = useState(false)
  const { register, handleSubmit, reset } = useForm({ defaultValues: { round: 'r1' } })

  const { data, isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: async () => (await api.get('/interviews/')).data,
  })
  const { data: upcoming } = useQuery({
    queryKey: ['interviews-upcoming'],
    queryFn: async () => (await api.get('/interviews/upcoming/')).data,
  })
  const { data: calendar } = useQuery({
    queryKey: ['interviews-calendar'],
    queryFn: async () => (await api.get('/interviews/calendar/')).data,
  })

  const createMut = useMutation({
    mutationFn: (payload) => api.post('/interviews/', payload),
    onSuccess: () => {
      toast.success('Interview scheduled')
      qc.invalidateQueries({ queryKey: ['interviews'] })
      qc.invalidateQueries({ queryKey: ['interviews-upcoming'] })
      qc.invalidateQueries({ queryKey: ['interviews-calendar'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
      setShow(false)
      reset({ round: 'r1' })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const interviews = data?.results || data || []

  return (
    <div>
      <PageHeader
        title="Interviews"
        subtitle="Calendar, upcoming alerts, and feedback notes"
        actions={
          <button className="btn-primary" onClick={() => setShow(true)}>
            <Plus size={16} /> Schedule
          </button>
        }
      />

      {upcoming?.length > 0 && (
        <div className="mb-6 rounded-2xl border border-accent/30 bg-accent/10 p-4">
          <p className="text-sm font-semibold text-accent">Upcoming (next 14 days)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {upcoming.map((i) => (
              <span key={i.id} className="rounded-lg bg-ink-900/60 px-3 py-1.5 text-sm text-white">
                {i.company_name} · {i.date}
                {i.time ? ` ${i.time.slice(0, 5)}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(calendar || []).slice(0, 9).map((e) => (
          <div key={e.id} className="glass-card p-4">
            <p className="font-medium text-white">{e.title}</p>
            <p className="mt-1 text-xs text-mist-400">
              {e.date}
              {e.time ? ` · ${e.time.slice(0, 5)}` : ''}
            </p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : interviews.length === 0 ? (
        <EmptyState title="No interviews" description="Schedule your first interview to unlock reminders." />
      ) : (
        <div className="space-y-3">
          {interviews.map((i) => (
            <div key={i.id} className="glass-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg text-white">{i.company_name}</p>
                  <p className="text-sm text-mist-300">
                    {ROUNDS.find((r) => r.value === i.round)?.label || i.round} ·{' '}
                    {format(parseISO(i.date), 'MMM d, yyyy')}
                    {i.time ? ` · ${i.time.slice(0, 5)}` : ''}
                  </p>
                </div>
                {i.meeting_link && (
                  <a href={i.meeting_link} target="_blank" rel="noreferrer" className="btn-ghost">
                    Join
                  </a>
                )}
              </div>
              {(i.notes || i.feedback) && (
                <p className="mt-3 text-sm text-mist-400">{i.feedback || i.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-white">Schedule interview</h2>
              <button onClick={() => setShow(false)}>
                <X size={18} className="text-mist-400" />
              </button>
            </div>
            <form
              className="space-y-3"
              onSubmit={handleSubmit((v) =>
                createMut.mutate({ ...v, time: v.time || null, application: v.application || null })
              )}
            >
              <div>
                <label className="label">Company</label>
                <input className="input" required {...register('company_name')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input className="input" type="date" required {...register('date')} />
                </div>
                <div>
                  <label className="label">Time</label>
                  <input className="input" type="time" {...register('time')} />
                </div>
              </div>
              <div>
                <label className="label">Round</label>
                <select className="input" {...register('round')}>
                  {ROUNDS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Platform</label>
                <input className="input" placeholder="Zoom / Meet / Onsite" {...register('platform')} />
              </div>
              <div>
                <label className="label">Interviewer</label>
                <input className="input" {...register('interviewer_name')} />
              </div>
              <div>
                <label className="label">Meeting link</label>
                <input className="input" {...register('meeting_link')} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" {...register('notes')} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => setShow(false)}>
                  Cancel
                </button>
                <button className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
