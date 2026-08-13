import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { PageHeader, Skeleton, StatCard } from '../components/ui/Primitives'
import { STATUS_COLUMNS, SOURCES } from '../lib/constants'
import { formatPercent } from '../lib/utils'

const COLORS = ['#2DD4A8', '#5B8DEF', '#FBBF24', '#FB7185', '#A78BFA', '#6B829D', '#F87171', '#818CF8', '#34D399']

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await api.get('/analytics/overview/')).data,
  })

  const cards = data?.cards || {}
  const statusData = (data?.by_status || []).map((s) => ({
    name: STATUS_COLUMNS.find((c) => c.key === s.status)?.label || s.status,
    value: s.count,
  }))
  const monthly = (data?.applications_per_month || []).map((m) => ({
    name: m.month?.slice(0, 7) || '—',
    count: m.count,
  }))
  const weekly = (data?.weekly_activity || []).slice(-8).map((w) => ({
    name: w.week?.slice(5, 10) || '—',
    count: w.count,
  }))
  const sourceSuccess = data?.source_success || []

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your application funnel and placement momentum"
        actions={
          <>
            <Link to="/app/applications" className="btn-ghost">
              View applications
            </Link>
            <Link to="/app/board" className="btn-primary">
              Open board
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applications" value={cards.total_applications} />
        <StatCard label="Applied jobs" value={cards.applied_jobs} />
        <StatCard label="Interviews in pipeline" value={cards.interviews_scheduled} />
        <StatCard label="Rejections" value={cards.rejections} />
        <StatCard label="Offers received" value={cards.offers_received} />
        <StatCard label="Offer rate" value={cards.offer_rate} suffix="%" />
        <StatCard label="Interview conversion" value={cards.interview_conversion_rate} suffix="%" />
        <StatCard
          label="Top source"
          value={0}
          hint={
            sourceSuccess[0]
              ? `${SOURCES.find((s) => s.value === sourceSuccess[0].source)?.label || sourceSuccess[0].source} · ${sourceSuccess[0].offers} offers`
              : 'Add applications to unlock'
          }
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="glass-card p-5">
          <p className="mb-4 font-display text-lg text-white">Applications per month</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="fillA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2DD4A8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2DD4A8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#6B829D" fontSize={12} />
                <YAxis stroke="#6B829D" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#121826', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="count" stroke="#2DD4A8" fill="url(#fillA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <p className="mb-4 font-display text-lg text-white">Status distribution</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#121826', border: '1px solid rgba(255,255,255,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <p className="mb-4 font-display text-lg text-white">Weekly activity</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#6B829D" fontSize={12} />
                <YAxis stroke="#6B829D" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#121826', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Bar dataKey="count" fill="#5B8DEF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <p className="mb-4 font-display text-lg text-white">Platform performance</p>
          <div className="space-y-3">
            {sourceSuccess.length === 0 && <p className="text-sm text-mist-400">No source data yet.</p>}
            {sourceSuccess.slice(0, 6).map((s) => (
              <div key={s.source} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-white">
                    {SOURCES.find((x) => x.value === s.source)?.label || s.source}
                  </p>
                  <p className="text-xs text-mist-400">{s.applications} apps · {s.offers} offers</p>
                </div>
                <p className="font-mono text-sm text-accent">{formatPercent(s.interview_rate)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
