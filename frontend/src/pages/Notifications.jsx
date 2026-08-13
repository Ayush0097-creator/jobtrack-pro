import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/client'
import { PageHeader, EmptyState, Skeleton } from '../components/ui/Primitives'

export default function Notifications() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications/')).data,
  })

  const readMut = useMutation({
    mutationFn: (id) => api.post(`/notifications/${id}/read/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const readAllMut = useMutation({
    mutationFn: () => api.post('/notifications/read_all/'),
    onSuccess: () => {
      toast.success('All marked read')
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
  const refreshMut = useMutation({
    mutationFn: () => api.post('/notifications/refresh_reminders/'),
    onSuccess: (res) => {
      toast.success(`Created ${res.data.created} reminders`)
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const items = data?.results || data || []

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Interview alerts, deadlines, and follow-ups"
        actions={
          <>
            <button className="btn-ghost" onClick={() => refreshMut.mutate()}>
              Refresh reminders
            </button>
            <button className="btn-primary" onClick={() => readAllMut.mutate()}>
              Mark all read
            </button>
          </>
        }
      />

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : items.length === 0 ? (
        <EmptyState title="Inbox clear" description="Reminders will appear for upcoming interviews and deadlines." />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className={`glass-card flex items-start justify-between gap-3 p-4 ${n.is_read ? 'opacity-60' : ''}`}
            >
              <div>
                <p className="font-medium text-white">{n.title}</p>
                <p className="mt-1 text-sm text-mist-400">{n.message}</p>
                <p className="mt-2 text-[10px] uppercase text-mist-400">{n.category}</p>
              </div>
              <div className="flex gap-2">
                {n.link && (
                  <Link to={n.link} className="btn-ghost">
                    Open
                  </Link>
                )}
                {!n.is_read && (
                  <button className="btn-ghost" onClick={() => readMut.mutate(n.id)}>
                    Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
