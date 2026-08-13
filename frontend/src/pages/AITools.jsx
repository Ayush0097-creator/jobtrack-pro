import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'
import { PageHeader } from '../components/ui/Primitives'
import { errorMessage } from '../lib/utils'

function MatchRing({ score = 0 }) {
  const r = 54
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c
  return (
    <div className="relative mx-auto h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          stroke="#2DD4A8"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-3xl text-white">{Math.round(score)}%</p>
        <p className="text-[10px] uppercase text-mist-400">Match</p>
      </div>
    </div>
  )
}

export default function AITools() {
  const [jd, setJd] = useState('')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [resumeId, setResumeId] = useState('')
  const [match, setMatch] = useState(null)
  const [letter, setLetter] = useState('')
  const [prep, setPrep] = useState(null)

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => (await api.get('/resumes/')).data,
  })
  const resumeList = resumes?.results || resumes || []
  const selected = useMemo(
    () => resumeList.find((r) => String(r.id) === String(resumeId)) || resumeList[0],
    [resumeList, resumeId]
  )

  const matchMut = useMutation({
    mutationFn: () =>
      api.post('/ai/job-match/', {
        job_description: jd,
        resume_id: selected?.id,
      }),
    onSuccess: (res) => {
      setMatch(res.data)
      toast.success('Match calculated')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const letterMut = useMutation({
    mutationFn: () =>
      api.post('/ai/cover-letter/', {
        company_name: company,
        position,
        job_description: jd,
        resume_id: selected?.id,
      }),
    onSuccess: (res) => {
      setLetter(res.data.cover_letter)
      toast.success('Cover letter ready')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const pdfMut = useMutation({
    mutationFn: async () => {
      const res = await api.post(
        '/ai/cover-letter/',
        {
          company_name: company,
          position,
          job_description: jd,
          resume_id: selected?.id,
          as_pdf: true,
        },
        { responseType: 'blob' }
      )
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `cover_letter_${company || 'job'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const prepMut = useMutation({
    mutationFn: () =>
      api.post('/ai/interview-prep/', {
        company_name: company || 'Target Company',
        role: position || 'Software Engineer',
      }),
    onSuccess: (res) => {
      setPrep(res.data)
      toast.success('Prep pack generated')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div>
      <PageHeader title="AI tools" subtitle="Job match, cover letters, and interview prep" />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card space-y-3 p-5">
          <div>
            <label className="label">Resume</label>
            <select
              className="input"
              value={selected?.id || ''}
              onChange={(e) => setResumeId(e.target.value)}
            >
              {resumeList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} v{r.version}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Company</label>
              <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div>
              <label className="label">Position</label>
              <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Job description</label>
            <textarea className="input min-h-40" value={jd} onChange={(e) => setJd(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => matchMut.mutate()} disabled={matchMut.isPending}>
              Calculate match
            </button>
            <button className="btn-ghost" onClick={() => letterMut.mutate()} disabled={letterMut.isPending}>
              Generate cover letter
            </button>
            <button className="btn-ghost" onClick={() => pdfMut.mutate()} disabled={pdfMut.isPending}>
              Download PDF
            </button>
            <button className="btn-ghost" onClick={() => prepMut.mutate()} disabled={prepMut.isPending}>
              Interview prep
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {match && (
            <div className="glass-card p-5">
              <MatchRing score={match.score} />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs uppercase text-mist-400">Matched</p>
                  <div className="flex flex-wrap gap-1">
                    {(match.matched_skills || []).map((s) => (
                      <span key={s} className="rounded-md bg-accent/15 px-2 py-0.5 text-xs text-accent">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase text-mist-400">Missing</p>
                  <div className="flex flex-wrap gap-1">
                    {(match.missing_skills || []).map((s) => (
                      <span key={s} className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-mist-300">
                {(match.recommendations || []).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {letter && (
            <div className="glass-card p-5">
              <p className="mb-3 font-display text-lg text-white">Cover letter</p>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-mist-200">{letter}</pre>
            </div>
          )}

          {prep && (
            <div className="glass-card space-y-4 p-5">
              <p className="font-display text-lg text-white">Interview prep</p>
              {['dsa_questions', 'technical_questions', 'hr_questions'].map((key) => (
                <div key={key}>
                  <p className="mb-2 text-xs uppercase text-mist-400">{key.replace('_', ' ')}</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-mist-200">
                    {(prep[key] || []).map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
