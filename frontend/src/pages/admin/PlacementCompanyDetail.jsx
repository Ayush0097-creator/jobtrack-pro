import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui/Primitives'
import { errorMessage } from '../../lib/utils'

const STATUS_OPTIONS = ['applied', 'shortlisted', 'on_hold', 'selected', 'rejected']
const STATUS_COLORS = {
  applied: 'bg-blue-500/20 text-blue-300',
  shortlisted: 'bg-yellow-500/20 text-yellow-300',
  on_hold: 'bg-gray-500/20 text-gray-300',
  selected: 'bg-green-500/20 text-green-300',
  rejected: 'bg-red-500/20 text-red-400',
}

export default function PlacementCompanyDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [tab, setTab] = useState('eligible') // eligible | applications
  const [search, setSearch] = useState('')

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['placement-company', id],
    queryFn: async () => (await api.get(`/placements/companies/${id}/`)).data,
  })

  const { data: allStudentsRaw = [] } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => (await api.get('/auth/admin/users/?role=student')).data,
  })
  const allStudents = allStudentsRaw?.results || (Array.isArray(allStudentsRaw) ? allStudentsRaw : [])

  const { data: eligibleRaw, isLoading: loadingEligible } = useQuery({
    queryKey: ['eligible-students', id],
    queryFn: async () => (await api.get(`/placements/eligible-students/?company=${id}`)).data,
  })
  const eligible = eligibleRaw?.results || (Array.isArray(eligibleRaw) ? eligibleRaw : [])

  const { data: applicationsRaw, isLoading: loadingApps } = useQuery({
    queryKey: ['placement-apps', id],
    queryFn: async () => (await api.get(`/placements/admin/applications/?company=${id}`)).data,
  })
  const applications = applicationsRaw?.results || (Array.isArray(applicationsRaw) ? applicationsRaw : [])

  const addEligibleMut = useMutation({
    mutationFn: (studentId) => api.post('/placements/eligible-students/', {
      company: parseInt(id), student: studentId, is_eligible: true,
    }),
    onSuccess: () => { qc.invalidateQueries(['eligible-students', id]); toast.success('Student added') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const toggleEligibleMut = useMutation({
    mutationFn: ({ eid, is_eligible }) => api.patch(`/placements/eligible-students/${eid}/`, { is_eligible }),
    onSuccess: () => { qc.invalidateQueries(['eligible-students', id]); toast.success('Updated') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const removeEligibleMut = useMutation({
    mutationFn: (eid) => api.delete(`/placements/eligible-students/${eid}/`),
    onSuccess: () => { qc.invalidateQueries(['eligible-students', id]); toast.success('Removed') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const updateStatusMut = useMutation({
    mutationFn: ({ appId, status, admin_notes }) =>
      api.patch(`/placements/admin/applications/${appId}/`, { status, admin_notes }),
    onSuccess: () => { qc.invalidateQueries(['placement-apps', id]); toast.success('Status updated') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const computeMut = useMutation({
    mutationFn: () => api.post(`/placements/companies/${id}/compute-eligible/`),
    onSuccess: (res) => {
      qc.invalidateQueries(['eligible-students', id])
      toast.success(`Auto-computed: ${res.data.added} added, ${res.data.skipped} already exist`)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const eligibleIds = new Set(eligible.map(e => e.student))
  const unadded = allStudents.filter(s => !eligibleIds.has(s.id) &&
    (s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())))

  if (loadingCompany) return <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>
  if (!company) return <EmptyState title="Company not found" />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/placements" className="text-mist-400 hover:text-white text-sm">← Companies</Link>
      </div>

      {/* Company header */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-white">{company.name}</h1>
            <p className="text-mist-300 mt-1">{company.job_role} {company.package_lpa ? `· ₹${company.package_lpa} LPA` : ''}</p>
            {company.description && <p className="text-sm text-mist-400 mt-2 max-w-xl">{company.description}</p>}
          </div>
          <div className="flex gap-4 text-center">
            {[
              { label: 'Eligible', val: company.total_eligible },
              { label: 'Applied', val: company.total_applied },
              { label: 'Selected', val: company.total_selected },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-lg px-4 py-2">
                <div className="font-display text-2xl text-white">{s.val}</div>
                <div className="text-xs text-mist-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-mist-300">
          {company.min_cgpa > 0 && <span className="bg-white/5 px-3 py-1 rounded-full">Min CGPA: {company.min_cgpa}</span>}
          {company.max_backlogs === 0 && <span className="bg-white/5 px-3 py-1 rounded-full">No backlogs</span>}
          {company.graduation_year && <span className="bg-white/5 px-3 py-1 rounded-full">Batch: {company.graduation_year}</span>}
          {(company.allowed_branches || []).map(b => (
            <span key={b} className="bg-white/5 px-3 py-1 rounded-full">{b}</span>
          ))}
          {company.visit_date && <span className="bg-white/5 px-3 py-1 rounded-full">📅 {new Date(company.visit_date).toLocaleDateString()}</span>}
          {company.registration_deadline && (
            <span className={`px-3 py-1 rounded-full ${company.is_deadline_passed ? 'bg-red-500/20 text-red-400' : 'bg-white/5'}`}>
              Deadline: {new Date(company.registration_deadline).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
        {['eligible', 'applications'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-accent-500 text-white' : 'text-mist-300 hover:text-white'}`}>
            {t === 'eligible' ? `Eligible Students (${eligible.length})` : `Applications (${applications.length})`}
          </button>
        ))}
      </div>

      {tab === 'eligible' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary text-sm" onClick={() => computeMut.mutate()} disabled={computeMut.isPending}>
              ⚡ Auto-Compute Eligible
            </button>
          </div>

          {/* Eligible list */}
          {loadingEligible ? <Skeleton className="h-40" /> : eligible.length === 0 ? (
            <EmptyState title="No eligible students" message="Use Auto-Compute or add manually below." />
          ) : (
            <div className="glass-card divide-y divide-white/5">
              {eligible.map(e => (
                <div key={e.id} className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{e.student_detail?.full_name || e.student_detail?.email}</p>
                    <p className="text-xs text-mist-400">
                      {e.student_detail?.branch} · {e.student_detail?.graduation_year} · CGPA: {e.student_detail?.cgpa ?? 'N/A'}
                      · Backlogs: {e.student_detail?.backlogs ?? 0}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${e.is_eligible ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {e.is_eligible ? 'Eligible' : 'Blocked'}
                  </span>
                  <div className="flex gap-2">
                    <button className="text-xs btn-ghost py-1 px-2"
                      onClick={() => toggleEligibleMut.mutate({ eid: e.id, is_eligible: !e.is_eligible })}>
                      {e.is_eligible ? 'Block' : 'Restore'}
                    </button>
                    <button className="text-xs btn-ghost py-1 px-2 text-red-400"
                      onClick={() => { if (confirm('Remove?')) removeEligibleMut.mutate(e.id) }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add students manually */}
          <div className="glass-card p-4 space-y-3">
            <p className="font-display text-sm text-mist-300">Add Students Manually</p>
            <input className="input" placeholder="Search by name or email…" value={search}
              onChange={e => setSearch(e.target.value)} />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {unadded.slice(0, 20).map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                  <span className="text-sm text-mist-200">{s.full_name || s.email} <span className="text-mist-400 text-xs">({s.branch})</span></span>
                  <button className="text-xs btn-primary py-1 px-3" onClick={() => addEligibleMut.mutate(s.id)}>Add</button>
                </div>
              ))}
              {unadded.length === 0 && search && <p className="text-xs text-mist-400 text-center py-2">No matching students found</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'applications' && (
        <div>
          {loadingApps ? <Skeleton className="h-40" /> : applications.length === 0 ? (
            <EmptyState title="No applications yet" message="Students will appear here after they apply." />
          ) : (
            <div className="glass-card divide-y divide-white/5">
              {applications.map(app => (
                <div key={app.id} className="p-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{app.student_detail?.full_name || app.student_detail?.email}</p>
                    <p className="text-xs text-mist-400">
                      {app.student_detail?.branch} · CGPA: {app.student_detail?.cgpa ?? 'N/A'} · Applied: {new Date(app.applied_at).toLocaleDateString()}
                    </p>
                    {app.admin_notes && <p className="text-xs text-mist-300 mt-1 italic">{app.admin_notes}</p>}
                  </div>
                  <select
                    className="input w-36 text-sm"
                    value={app.status}
                    onChange={e => updateStatusMut.mutate({ appId: app.id, status: e.target.value, admin_notes: app.admin_notes })}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
