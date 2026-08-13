import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui/Primitives'

export default function AdminAIUsage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get('/analytics/admin/')).data,
  })

  if (isLoading) return <Skeleton className="h-40" />

  const features = data?.ai_by_feature || []
  const recent = data?.recent_ai || []

  return (
    <div>
      <PageHeader title="AI usage" subtitle="Monitor resume analysis, match scores, and coach calls" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase text-mist-400">Total AI calls</p>
          <p className="mt-2 font-display text-3xl text-white">{data?.ai_calls ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase text-mist-400">Features used</p>
          <p className="mt-2 font-display text-3xl text-white">{features.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase text-mist-400">Resumes analyzed</p>
          <p className="mt-2 font-display text-3xl text-white">{data?.resumes ?? 0}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-3 font-display text-lg text-white">By feature</p>
          {features.length === 0 ? (
            <EmptyState title="No AI activity yet" description="Student AI tools will log usage here." />
          ) : (
            <div className="space-y-2">
              {features.map((row) => (
                <div key={row.feature} className="flex justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <span className="text-mist-200">{row.feature}</span>
                  <span className="font-mono text-sky-300">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-3 font-display text-lg text-white">Recent calls</p>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {recent.length === 0 && <p className="text-sm text-mist-400">Nothing yet.</p>}
            {recent.map((row) => (
              <div key={row.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white">{row.feature}</p>
                  <span className={`text-xs ${row.success ? 'text-accent' : 'text-red-300'}`}>
                    {row.success ? 'ok' : 'fail'}
                  </span>
                </div>
                <p className="text-xs text-mist-400">
                  {row.user__email || 'system'} · {row.provider} ·{' '}
                  {new Date(row.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
