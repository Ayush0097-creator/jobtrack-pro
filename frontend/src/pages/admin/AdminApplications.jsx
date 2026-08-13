import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui/Primitives'
import { STATUS_COLUMNS, statusLabel } from '../../lib/constants'

export default function AdminApplications() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['admin-applications', search, status],
    queryFn: async () => {
      const p = new URLSearchParams()
      if (search) p.set('search', search)
      if (status) p.set('status', status)
      return (await api.get(`/analytics/admin/applications/?${p}`)).data
    },
  })

  const apps = data?.results || []

  return (
    <div>
      <PageHeader title="All applications" subtitle="Platform-wide job application monitoring" />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <input
          className="input md:col-span-2"
          placeholder="Search company, role, or student"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_COLUMNS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : apps.length === 0 ? (
        <EmptyState title="No applications" description="Student applications will appear here." />
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div
              key={app.id}
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-display text-lg text-white">{app.job_title}</p>
                <p className="text-sm text-mist-300">
                  {app.company_name} · {statusLabel(app.status)}
                </p>
                <p className="mt-1 text-xs text-mist-400">
                  Student: {app.student_name} ({app.student_email})
                </p>
              </div>
              <div className="text-right text-xs text-mist-400">
                {app.match_score != null && (
                  <p className="mb-1 font-mono text-sky-300">{app.match_score}% match</p>
                )}
                <p>Updated {new Date(app.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
