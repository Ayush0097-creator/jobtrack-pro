import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui/Primitives'
import { errorMessage } from '../../lib/utils'

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'company_visit', label: 'Company Visit' },
  { value: 'registration', label: 'Registration' },
  { value: 'aptitude', label: 'Aptitude Test' },
  { value: 'interview', label: 'Interview' },
  { value: 'result', label: 'Result' },
  { value: 'offer', label: 'Offer Letter' },
]

const CATEGORY_COLORS = {
  general: 'bg-blue-500/20 text-blue-300',
  company_visit: 'bg-purple-500/20 text-purple-300',
  registration: 'bg-yellow-500/20 text-yellow-300',
  aptitude: 'bg-orange-500/20 text-orange-300',
  interview: 'bg-pink-500/20 text-pink-300',
  result: 'bg-green-500/20 text-green-300',
  offer: 'bg-emerald-500/20 text-emerald-300',
}

const EMPTY_FORM = { title: '', content: '', category: 'general', company: '', is_published: false }

function AnnouncementModal({ initial, companies, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-card w-full max-w-xl p-6 space-y-4">
        <h2 className="font-display text-xl text-white">{initial?.id ? 'Edit Announcement' : 'New Announcement'}</h2>
        <div>
          <label className="label">Title *</label>
          <input className="input" required value={form.title} onChange={e => set('title', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Company (optional)</label>
            <select className="input" value={form.company || ''} onChange={e => set('company', e.target.value || null)}>
              <option value="">Global</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Content *</label>
          <textarea className="input min-h-[120px]" required value={form.content} onChange={e => set('content', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} className="accent-accent-500" />
          <span className="text-sm text-mist-200">Publish immediately</span>
        </label>
        <div className="flex gap-3">
          <button className="btn-primary flex-1" onClick={() => onSave(form)}>Save</button>
          <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function PlacementAnnouncementsAdmin() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [filterCat, setFilterCat] = useState('')

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => (await api.get('/placements/admin/announcements/')).data,
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['placement-companies'],
    queryFn: async () => (await api.get('/placements/companies/')).data,
  })

  const saveMut = useMutation({
    mutationFn: (payload) => modal?.id
      ? api.patch(`/placements/admin/announcements/${modal.id}/`, payload)
      : api.post('/placements/admin/announcements/', payload),
    onSuccess: () => { qc.invalidateQueries(['admin-announcements']); toast.success('Saved'); setModal(null) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/placements/admin/announcements/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['admin-announcements']); toast.success('Deleted') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const togglePublishMut = useMutation({
    mutationFn: ({ id, is_published }) =>
      api.post(`/placements/admin/announcements/${id}/${is_published ? 'unpublish' : 'publish'}/`),
    onSuccess: () => { qc.invalidateQueries(['admin-announcements']); toast.success('Updated') },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const filtered = filterCat ? announcements.filter(a => a.category === filterCat) : announcements

  return (
    <div>
      <PageHeader
        title="Placement Announcements"
        subtitle="Create and manage placement notices for students"
        action={<button className="btn-primary" onClick={() => setModal('create')}>+ New Announcement</button>}
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        <button className={`text-xs px-3 py-1 rounded-full ${!filterCat ? 'bg-accent-500 text-white' : 'bg-white/10 text-mist-300'}`} onClick={() => setFilterCat('')}>All</button>
        {CATEGORIES.map(c => (
          <button key={c.value}
            className={`text-xs px-3 py-1 rounded-full ${filterCat === c.value ? 'bg-accent-500 text-white' : 'bg-white/10 text-mist-300'}`}
            onClick={() => setFilterCat(c.value)}>{c.label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No announcements" message="Create your first placement announcement." />
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[a.category]}`}>{a.category.replace('_', ' ')}</span>
                  {a.company_name && <span className="text-xs bg-white/10 text-mist-300 px-2 py-0.5 rounded-full">{a.company_name}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_published ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {a.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h3 className="font-medium text-white mt-1">{a.title}</h3>
                <p className="text-sm text-mist-400 mt-1 line-clamp-2">{a.content}</p>
                <p className="text-xs text-mist-500 mt-1">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="btn-ghost text-sm py-1"
                  onClick={() => togglePublishMut.mutate({ id: a.id, is_published: a.is_published })}>
                  {a.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button className="btn-ghost text-sm py-1" onClick={() => setModal(a)}>Edit</button>
                <button className="btn-ghost text-sm py-1 text-red-400"
                  onClick={() => { if (confirm('Delete?')) deleteMut.mutate(a.id) }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'create' || (modal && modal.id)) && (
        <AnnouncementModal
          initial={modal === 'create' ? null : modal}
          companies={companies}
          onClose={() => setModal(null)}
          onSave={(payload) => saveMut.mutate(payload)}
        />
      )}
    </div>
  )
}
