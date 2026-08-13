import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Upload } from 'lucide-react'
import api from '../api/client'
import { PageHeader, EmptyState, Skeleton } from '../components/ui/Primitives'
import { RESUME_CATEGORIES } from '../lib/constants'
import { errorMessage } from '../lib/utils'

export default function Resumes() {
  const qc = useQueryClient()
  const fileRef = useRef()
  const [title, setTitle] = useState('Software Developer Resume')
  const [category, setCategory] = useState('software')

  const { data, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => (await api.get('/resumes/')).data,
  })

  const uploadMut = useMutation({
    mutationFn: async (file) => {
      const form = new FormData()
      form.append('file', file)
      form.append('title', title)
      form.append('category', category)
      return api.post('/resumes/', form)
    },
    onSuccess: () => {
      toast.success('Uploaded & analyzed')
      qc.invalidateQueries({ queryKey: ['resumes'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const primaryMut = useMutation({
    mutationFn: (id) => api.post(`/resumes/${id}/set_primary/`),
    onSuccess: () => {
      toast.success('Primary resume set')
      qc.invalidateQueries({ queryKey: ['resumes'] })
    },
  })

  const reanalyzeMut = useMutation({
    mutationFn: (id) => api.post(`/resumes/${id}/reanalyze/`),
    onSuccess: () => {
      toast.success('Re-analyzed')
      qc.invalidateQueries({ queryKey: ['resumes'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const resumes = data?.results || data || []

  return (
    <div>
      <PageHeader title="Resumes" subtitle="Versioned uploads with ATS analysis" />

      <div className="glass-card mb-6 grid gap-3 p-5 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {RESUME_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn-primary w-full" onClick={() => fileRef.current?.click()} disabled={uploadMut.isPending}>
            <Upload size={16} /> {uploadMut.isPending ? 'Uploading…' : 'Upload PDF'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadMut.mutate(file)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : resumes.length === 0 ? (
        <EmptyState title="No resumes" description="Upload a PDF to generate ATS score and skill extraction." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {resumes.map((r) => (
            <div key={r.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg text-white">
                    {r.title}{' '}
                    <span className="text-sm text-mist-400">v{r.version}</span>
                  </p>
                  <p className="text-xs text-mist-400">
                    {RESUME_CATEGORIES.find((c) => c.value === r.category)?.label} ·{' '}
                    {new Date(r.upload_date).toLocaleDateString()}
                    {r.is_primary ? ' · Primary' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl text-accent">{r.ats_score ?? '—'}%</p>
                  <p className="text-[10px] uppercase text-mist-400">ATS</p>
                </div>
              </div>
              {r.analysis && (
                <div className="mt-4 space-y-2 text-sm">
                  {(r.analysis.strengths || []).slice(0, 2).map((s) => (
                    <p key={s} className="text-mist-300">
                      + {s}
                    </p>
                  ))}
                  {(r.analysis.suggestions || []).slice(0, 2).map((s) => (
                    <p key={s} className="text-mist-400">
                      → {s}
                    </p>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {!r.is_primary && (
                  <button className="btn-ghost" onClick={() => primaryMut.mutate(r.id)}>
                    Set primary
                  </button>
                )}
                <button className="btn-ghost" onClick={() => reanalyzeMut.mutate(r.id)}>
                  Re-analyze
                </button>
                {r.file && (
                  <a className="btn-ghost" href={r.file} target="_blank" rel="noreferrer">
                    Open PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
