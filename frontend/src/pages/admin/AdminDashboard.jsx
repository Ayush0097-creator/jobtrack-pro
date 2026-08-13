import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { PageHeader, Skeleton } from '../../components/ui/Primitives'
import { STATUS_COLUMNS } from '../../lib/constants'

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get('/analytics/admin/')).data,
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  const monthly = (data?.applications_per_month || []).map((m) => ({
    name: m.month?.slice(0, 7) || '—',
    count: m.count,
  }))
  const byStatus = (data?.applications_by_status || []).map((s) => ({
    name: STATUS_COLUMNS.find((c) => c.key === s.status)?.label || s.status,
    count: s.count,
  }))

  return (
    <div>
      <PageHeader
        title="Admin overview"
        subtitle="Platform health across students, applications, and AI"
        actions={
          <>
            <Link
              to="/admin/users"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-mist-100 hover:bg-white/10"
            >
              Manage users
            </Link>
            <Link
              to="/admin/applications"
              className="inline-flex items-center rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-ink-950 hover:bg-sky-400"
            >
              View applications
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Students', value: data?.students },
          { label: 'Active students', value: data?.active_students },
          { label: 'Applications', value: data?.applications },
          { label: 'Interviews', value: data?.interviews },
          { label: 'Resumes', value: data?.resumes },
          { label: 'AI calls', value: data?.ai_calls },
          { label: 'Admins', value: data?.admins },
          { label: 'Total users', value: data?.users },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-mist-400">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-white">{card.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-4 font-display text-lg text-white">Applications per month</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="adminFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B8DEF" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#5B8DEF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#6B829D" fontSize={12} />
                <YAxis stroke="#6B829D" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0c1220', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="count" stroke="#5B8DEF" fill="url(#adminFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-4 font-display text-lg text-white">Status distribution</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#6B829D" fontSize={11} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis stroke="#6B829D" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0c1220', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Bar dataKey="count" fill="#FBBF24" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
