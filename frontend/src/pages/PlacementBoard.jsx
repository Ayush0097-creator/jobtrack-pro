import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../api/client'
import { EmptyState, PageHeader, Skeleton } from '../components/ui/Primitives'
import { errorMessage } from '../lib/utils'

const STATUS_STYLES = {
  applied: 'bg-blue-500/20 text-blue-300',
  shortlisted: 'bg-yellow-500/20 text-yellow-300',
  on_hold: 'bg-gray-500/20 text-gray-300',
  selected: 'bg-green-500/20 text-green-300',
  rejected: 'bg-red-500/20 text-red-400',
}

export default function PlacementBoard() {
  const qc = useQueryClient()

  const { data: companiesRaw, isLoading } = useQuery({
    queryKey: ['my-eligible-companies'],
    queryFn: async () => (await api.get('/placements/my/eligible-companies/')).data,
  })
  const companies = companiesRaw?.results || (Array.isArray(companiesRaw) ? companiesRaw : [])

  const applyMut = useMutation({
    mutationFn: (companyId) => api.post('/placements/my/applications/', { company: companyId }),
    onSuccess: () => {
      qc.invalidateQueries(['my-eligible-companies'])
      toast.success('Application submitted! 🎉')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Opportunities"
        subtitle="Companies you are eligible to apply for"
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          title="No placement opportunities yet"
          message="You will see eligible companies here once the placement team adds them. Make sure your profile has CGPA, branch and graduation year filled in."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map(c => (
            <div key={c.id} className="glass-card flex flex-col p-5 gap-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg text-white truncate">{c.name}</h3>
                  <p className="text-sm text-mist-300 mt-0.5">{c.job_role}</p>
                </div>
                {c.applied && (
                  <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full ${STATUS_STYLES[c.application_status] || 'bg-white/10 text-mist-300'}`}>
                    {c.application_status}
                  </span>
                )}
              </div>

              {/* Package + Location */}
              <div className="flex gap-3 text-sm text-mist-300 flex-wrap">
                {c.package_lpa && (
                  <span className="flex items-center gap-1">
                    <span className="text-green-400 font-semibold">₹{c.package_lpa} LPA</span>
                  </span>
                )}
                {c.job_location && <span>📍 {c.job_location}</span>}
              </div>

              {/* Description */}
              {c.description && (
                <p className="text-xs text-mist-400 line-clamp-2">{c.description}</p>
              )}

              {/* Dates */}
              <div className="space-y-1 text-xs text-mist-400">
                {c.visit_date && (
                  <p>📅 Visit: <span className="text-mist-200">{new Date(c.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
                )}
                {c.registration_deadline && (
                  <p className={c.is_deadline_passed ? 'text-red-400' : ''}>
                    ⏰ Deadline: <span className={c.is_deadline_passed ? 'text-red-400 font-medium' : 'text-mist-200'}>
                      {new Date(c.registration_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {c.is_deadline_passed ? ' (Closed)' : ''}
                    </span>
                  </p>
                )}
              </div>

              {/* CTA */}
              <div className="mt-auto">
                {c.applied ? (
                  <div className="text-center text-sm text-mist-400 py-2 border border-white/10 rounded-lg">
                    {c.application_status === 'selected'
                      ? '🎊 Congratulations! You are selected.'
                      : c.application_status === 'rejected'
                        ? 'Not shortlisted this time.'
                        : '✅ Application submitted. Track status above.'}
                  </div>
                ) : c.is_deadline_passed ? (
                  <button className="w-full btn-ghost opacity-50 cursor-not-allowed" disabled>
                    Registration Closed
                  </button>
                ) : (
                  <button
                    className="w-full btn-primary"
                    onClick={() => {
                      if (confirm(`Apply to ${c.name} for ${c.job_role}?`)) applyMut.mutate(c.id)
                    }}
                    disabled={applyMut.isPending}
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
