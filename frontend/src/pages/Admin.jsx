import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../api/auth'
import { PageHeader, Skeleton } from '../components/ui/Primitives'

export default function Admin() {
  const { user } = useAuth()
  const { data: analytics, isLoading: aLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get('/analytics/admin/')).data,
    enabled: !!user?.is_staff,
  })
  const { data: users, isLoading: uLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/auth/admin/users/')).data,
    enabled: !!user?.is_staff,
  })

  if (!user?.is_staff) return <Navigate to="/dashboard" replace />

  const userList = users?.results || users || []

  return (
    <div>
      <PageHeader title="Admin" subtitle="Users, platform volume, and AI usage" />
      {aLoading || uLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="glass-card p-5">
              <p className="text-xs uppercase text-mist-400">Users</p>
              <p className="font-display text-3xl text-white">{analytics?.users}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs uppercase text-mist-400">Applications</p>
              <p className="font-display text-3xl text-white">{analytics?.applications}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs uppercase text-mist-400">AI calls</p>
              <p className="font-display text-3xl text-white">{analytics?.ai_calls}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card p-5">
              <p className="mb-3 font-display text-lg text-white">AI by feature</p>
              <div className="space-y-2">
                {(analytics?.ai_by_feature || []).map((row) => (
                  <div key={row.feature} className="flex justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <span className="text-mist-200">{row.feature}</span>
                    <span className="font-mono text-accent">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-5">
              <p className="mb-3 font-display text-lg text-white">Users</p>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {userList.map((u) => (
                  <div key={u.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <p className="text-white">{u.full_name || u.username}</p>
                    <p className="text-mist-400">{u.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
