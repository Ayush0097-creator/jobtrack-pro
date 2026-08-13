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
  Shield,
} from 'lucide-react'
import { useAuth } from '../../api/auth'
import { cn } from '../../lib/utils'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/applications', label: 'Applications', icon: Briefcase },
  { to: '/board', label: 'Kanban', icon: KanbanSquare },
  { to: '/interviews', label: 'Interviews', icon: CalendarDays },
  { to: '/resumes', label: 'Resumes', icon: FileText },
  { to: '/ai', label: 'AI Tools', icon: Sparkles },
  { to: '/coach', label: 'Career Coach', icon: MessageSquare },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/profile', label: 'Profile', icon: Settings },
]

export default function AppShell({ children }) {
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
              <Briefcase size={20} />
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-white">JobTrack Pro</p>
              <p className="text-xs text-mist-400">Placement command center</p>
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
                {item.to === '/notifications' && unread > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-ink-950">
                    {unread}
                  </span>
                )}
              </NavLink>
            ))}
            {user?.is_staff && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    'mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive ? 'bg-accent/15 text-accent' : 'text-mist-300 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <Shield size={18} />
                Admin
              </NavLink>
            )}
          </nav>

          <div className="mt-4 border-t border-white/5 pt-4">
            <p className="truncate px-2 text-sm font-medium text-white">{user?.full_name || user?.email}</p>
            <p className="truncate px-2 text-xs text-mist-400">{user?.email}</p>
            <button
              className="btn-ghost mt-3 w-full"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
