import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { PageHeader, Skeleton, EmptyState } from '../components/ui/Primitives'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'company_visit', label: 'Company Visit' },
  { value: 'registration', label: 'Registration' },
  { value: 'aptitude', label: 'Aptitude' },
  { value: 'interview', label: 'Interview' },
  { value: 'result', label: 'Result' },
  { value: 'offer', label: 'Offer' },
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

const CATEGORY_ICONS = {
  general: '📢', company_visit: '🏢', registration: '📝',
  aptitude: '🧠', interview: '🎤', result: '📊', offer: '🎉',
}

export default function PlacementAnnouncements() {
  const [filterCat, setFilterCat] = useState('')

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['placement-announcements', filterCat],
    queryFn: async () => {
      const params = filterCat ? `?category=${filterCat}` : ''
      return (await api.get(`/placements/announcements/${params}`)).data
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Announcements"
        subtitle="Official notices from the placement team"
      />

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setFilterCat(c.value)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              filterCat === c.value
                ? 'bg-accent-500 text-white'
                : 'bg-white/10 text-mist-300 hover:bg-white/20'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : announcements.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          message="The placement team will post updates here. Check back soon!"
        />
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="glass-card p-5">
              <div className="flex items-start gap-4">
                <div className="text-2xl flex-shrink-0">{CATEGORY_ICONS[a.category] || '📢'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[a.category]}`}>
                      {a.category.replace('_', ' ')}
                    </span>
                    {a.company_name && (
                      <span className="text-xs bg-white/10 text-mist-300 px-2 py-0.5 rounded-full">
                        🏢 {a.company_name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-white text-lg">{a.title}</h3>
                  <p className="text-sm text-mist-300 mt-2 whitespace-pre-line">{a.content}</p>
                  <p className="text-xs text-mist-500 mt-3">
                    Posted by {a.created_by_name || 'Placement Team'} · {new Date(a.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
