import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { PageHeader, Skeleton } from '../../components/ui/Primitives'

const STATUS_COLORS = {
  applied: 'text-blue-400', shortlisted: 'text-yellow-400',
  selected: 'text-green-400', rejected: 'text-red-400', on_hold: 'text-gray-400',
}

export default function PlacementDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['placement-dashboard'],
    queryFn: async () => (await api.get('/placements/dashboard/')).data,
  })

  const statCards = stats ? [
    { label: 'Total Companies', value: stats.total_companies, color: 'text-blue-400' },
    { label: 'Active Drives', value: stats.active_companies, color: 'text-green-400' },
    { label: 'Eligible Entries', value: stats.total_eligible_entries, color: 'text-purple-400' },
    { label: 'Applications', value: stats.total_applications, color: 'text-yellow-400' },
    { label: 'Offers Given', value: stats.total_selected, color: 'text-emerald-400' },
    { label: 'Announcements', value: stats.total_announcements, color: 'text-pink-400' },
  ] : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Dashboard"
        subtitle="Overview of all placement activities"
        action={
          <div className="flex gap-2">
            <Link to="/admin/placements" className="btn-ghost text-sm">Companies</Link>
            <Link to="/admin/placement-announcements" className="btn-primary text-sm">Announcements</Link>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(s => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className={`font-display text-3xl ${s.color}`}>{s.value}</div>
              <div className="text-xs text-mist-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Company breakdown table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display text-lg text-white">Company-wise Breakdown</h2>
          <Link to="/admin/placements" className="text-sm text-accent-400 hover:text-accent-300">View all →</Link>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-mist-400 text-left">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Package</th>
                  <th className="px-4 py-3 font-medium">Eligible</th>
                  <th className="px-4 py-3 font-medium">Applied</th>
                  <th className="px-4 py-3 font-medium">Shortlisted</th>
                  <th className="px-4 py-3 font-medium">Selected</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(stats?.company_breakdown || []).map(c => (
                  <tr key={c.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-mist-300">{c.job_role}</td>
                    <td className="px-4 py-3 text-mist-300">{c.package_lpa ? `₹${c.package_lpa}L` : '—'}</td>
                    <td className="px-4 py-3 text-purple-400">{c.eligible}</td>
                    <td className="px-4 py-3 text-blue-400">{c.applied}</td>
                    <td className="px-4 py-3 text-yellow-400">{c.shortlisted}</td>
                    <td className="px-4 py-3 text-green-400 font-medium">{c.selected}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {c.is_active ? 'Active' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/placements/${c.id}`} className="text-accent-400 hover:text-accent-300 text-xs">Manage →</Link>
                    </td>
                  </tr>
                ))}
                {(!stats?.company_breakdown || stats.company_breakdown.length === 0) && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-mist-400">No companies yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
