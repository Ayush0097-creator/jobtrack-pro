import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  KanbanSquare,
  CalendarDays,
  FileText,
  Sparkles,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  GraduationCap,
} from 'lucide-react'
import { useAuth } from '../../api/auth'
import { cn } from '../../lib/utils'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'

const nav = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/applications', label: 'Applications', icon: Briefcase },
  { to: '/app/board', label: 'Kanban', icon: KanbanSquare },
  { to: '/app/interviews', label: 'Interviews', icon: CalendarDays },
  { to: '/app/resumes', label: 'Resumes', icon: FileText },
  { to: '/app/ai', label: 'AI Insights', icon: Sparkles },
  { to: '/app/coach', label: 'Placement Prep', icon: MessageSquare },
  { to: '/app/notifications', label: 'Alerts', icon: Bell },
  { to: '/app/profile', label: 'Profile', icon: Settings },
]

export default function StudentShell({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications/')).data,
    refetchInterval: 60000,
  })
  const unread = (notifications?.results || notifications || []).filter((n) => !n.is_read).length

  return (
    <div className="min-h-screen bg-grid-fade">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-ink-900/60 p-4 backdrop-blur-xl lg:flex">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent shadow-glow">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-white">JobTrack Pro</p>
              <p className="text-xs text-accent">Student Portal</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-accent/15 text-accent'
                      : 'text-mist-300 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <item.icon size={18} />
                <span className="flex-1">{item.label}</span>
                {item.to === '/app/notifications' && unread > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-ink-950">
                    {unread}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 border-t border-white/5 pt-4">
            <p className="truncate px-2 text-sm font-medium text-white">{user?.full_name || user?.email}</p>
            <p className="truncate px-2 text-xs text-mist-400">Student · {user?.email}</p>
            <button
              className="btn-ghost mt-3 w-full"
              onClick={async () => {
                await logout()
                navigate('/student/login')
              }}
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/5 px-4 py-3 lg:hidden">
            <div className="flex items-center gap-2">
              <GraduationCap className="text-accent" size={18} />
              <span className="font-display font-semibold text-white">Student</span>
            </div>
            <button
              className="btn-ghost px-3 py-1.5 text-xs"
              onClick={async () => {
                await logout()
                navigate('/student/login')
              }}
            >
              Sign out
            </button>
          </header>
          <nav className="flex gap-1 overflow-x-auto border-b border-white/5 px-2 py-2 lg:hidden">
            {nav.slice(0, 6).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium',
                    isActive ? 'bg-accent/15 text-accent' : 'text-mist-400'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
