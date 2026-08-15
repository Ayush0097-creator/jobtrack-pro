import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui/Primitives'
import { errorMessage } from '../../lib/utils'

const EMPTY_FORM = {
  name: '', description: '', logo_url: '', website: '',
  job_role: '', job_location: '', package_lpa: '',
  min_cgpa: 0, allowed_branches: '', required_skills: '',
  graduation_year: '', max_backlogs: 0,
  registration_deadline: '', visit_date: '', is_active: true,
}

function CompanyModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      package_lpa: form.package_lpa ? parseFloat(form.package_lpa) : null,
      min_cgpa: parseFloat(form.min_cgpa) || 0,
      graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
      max_backlogs: parseInt(form.max_backlogs) || 0,
      allowed_branches: form.allowed_branches
        ? form.allowed_branches.split(',').map(s => s.trim()).filter(Boolean) : [],
      required_skills: form.required_skills
        ? form.required_skills.split(',').map(s => s.trim()).filter(Boolean) : [],
    }
    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="font-display text-xl text-white mb-4">
          {initial?.id ? 'Edit Company' : 'Add Company'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Company Name *</label>
              <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Job Role *</label>
              <input className="input" required value={form.job_role} onChange={e => set('job_role', e.target.value)} />
            </div>
            <div>
              <label className="label">Package (LPA)</label>
              <input className="input" type="number" step="0.1" value={form.package_lpa} onChange={e => set('package_lpa', e.target.value)} />
            </div>
            <div>
              <label className="label">Job Location</label>
              <input className="input" value={form.job_location} onChange={e => set('job_location', e.target.value)} />
            </div>
            <div>
              <label className="label">Website</label>
              <input className="input" type="url" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Logo URL</label>
              <input className="input" type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <hr className="border-white/10" />
          <p className="font-display text-sm text-mist-300 uppercase tracking-wider">Eligibility Criteria</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min CGPA</label>
              <input className="input" type="number" step="0.01" min="0" max="10" value={form.min_cgpa} onChange={e => set('min_cgpa', e.target.value)} />
            </div>
            <div>
              <label className="label">Max Backlogs (0 = none allowed)</label>
              <input className="input" type="number" min="0" value={form.max_backlogs} onChange={e => set('max_backlogs', e.target.value)} />
            </div>
            <div>
              <label className="label">Graduation Year (blank = any)</label>
              <input className="input" type="number" value={form.graduation_year} onChange={e => set('graduation_year', e.target.value)} placeholder="e.g. 2025" />
            </div>
            <div>
              <label className="label">Allowed Branches (comma separated)</label>
              <input className="input" value={form.allowed_branches} onChange={e => set('allowed_branches', e.target.value)} placeholder="CSE, IT, ECE" />
            </div>
            <div className="col-span-2">
              <label className="label">Required Skills (comma separated)</label>
              <input className="input" value={form.required_skills} onChange={e => set('required_skills', e.target.value)} placeholder="Python, React, SQL" />
            </div>
          </div>

          <hr className="border-white/10" />
          <p className="font-display text-sm text-mist-300 uppercase tracking-wider">Schedule</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Registration Deadline</label>
              <input className="input" type="datetime-local" value={form.registration_deadline?.slice(0, 16) || ''} onChange={e => set('registration_deadline', e.target.value)} />
            </div>
            <div>
              <label className="label">Visit Date</label>
              <input className="input" type="date" value={form.visit_date || ''} onChange={e => set('visit_date', e.target.value)} />
            </div>
          </div>

          <div className="col-span-2">
            <label className="label">Description</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="accent-accent-500" />
            <span className="text-sm text-mist-200">Active (visible to eligible students)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Save Company</button>
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PlacementCompanies() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'create' | company obj

  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['placement-companies'],
    queryFn: async () => (await api.get('/placements/companies/')).data,
  })
  const companies = companiesData?.results || (Array.isArray(companiesData) ? companiesData : [])

  const saveMut = useMutation({
    mutationFn: (payload) => modal?.id
      ? api.patch(`/placements/companies/${modal.id}/`, payload)
      : api.post('/placements/companies/', payload),
    onSuccess: () => {
      qc.invalidateQueries(['placement-companies'])
      toast.success(modal?.id ? 'Company updated' : 'Company added')
      setModal(null)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/placements/companies/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['placement-companies']); toast.success('Deleted') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const computeMut = useMutation({
    mutationFn: (id) => api.post(`/placements/companies/${id}/compute-eligible/`),
    onSuccess: (res, id) => {
      qc.invalidateQueries(['placement-companies'])
      toast.success(`Computed: ${res.data.added} added, ${res.data.skipped} skipped`)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const getInitialForm = (c) => ({
    ...c,
    allowed_branches: (c.allowed_branches || []).join(', '),
    required_skills: (c.required_skills || []).join(', '),
  })

  return (
    <div>
      <PageHeader
        title="Placement Companies"
        subtitle="Manage recruitment drives and eligibility"
        action={<button className="btn-primary" onClick={() => setModal('create')}>+ Add Company</button>}
      />

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : companies.length === 0 ? (
        <EmptyState title="No companies yet" message="Add your first placement company to get started." />
      ) : (
        <div className="space-y-4">
          {companies.map(c => (
            <div key={c.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-display text-white text-lg">{c.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-mist-300 mt-1">{c.job_role} {c.package_lpa ? `· ₹${c.package_lpa} LPA` : ''} {c.job_location ? `· ${c.job_location}` : ''}</p>
                <div className="flex gap-4 mt-2 text-xs text-mist-400">
                  <span>👥 {c.total_eligible} eligible</span>
                  <span>📋 {c.total_applied} applied</span>
                  <span>✅ {c.total_selected} selected</span>
                  {c.min_cgpa > 0 && <span>📊 Min CGPA: {c.min_cgpa}</span>}
                  {c.visit_date && <span>📅 {new Date(c.visit_date).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/admin/placements/${c.id}`} className="btn-ghost text-sm">Manage</Link>
                <button className="btn-ghost text-sm" onClick={() => computeMut.mutate(c.id)} disabled={computeMut.isPending}>
                  ⚡ Auto-Eligible
                </button>
                <button className="btn-ghost text-sm" onClick={() => setModal(getInitialForm(c))}>Edit</button>
                <button className="btn-ghost text-sm text-red-400 hover:text-red-300"
                  onClick={() => { if (confirm('Delete this company?')) deleteMut.mutate(c.id) }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'create' || (modal && modal.id)) && (
        <CompanyModal
          initial={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={(payload) => saveMut.mutate(payload)}
        />
      )}
    </div>
  )
}
