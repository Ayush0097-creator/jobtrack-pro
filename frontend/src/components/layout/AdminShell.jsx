import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Sparkles,
  LogOut,
  Shield,
  Building2,
  Megaphone,
  GraduationCap,
} from 'lucide-react'
import { useAuth } from '../../api/auth'
import { cn } from '../../lib/utils'

const nav = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Students & Users', icon: Users },
  { to: '/admin/applications', label: 'All Applications', icon: Briefcase },
  { to: '/admin/ai-usage', label: 'AI Usage', icon: Sparkles },
]

const placementNav = [
  { to: '/admin/placement-dashboard', label: 'Placement Overview', icon: GraduationCap },
  { to: '/admin/placements', label: 'Companies', icon: Building2 },
  { to: '/admin/placement-announcements', label: 'Announcements', icon: Megaphone },
]

export default function AdminShell({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#06080d]">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 10% 0%, rgba(91,141,239,0.18), transparent), radial-gradient(ellipse 50% 30% at 90% 10%, rgba(251,191,36,0.08), transparent)',
        }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#0c1220]/90 p-4 backdrop-blur-xl lg:flex">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
              <Shield size={20} />
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-white">JobTrack Pro</p>
              <p className="text-xs text-sky-400">Admin Console</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-mist-400">Core</p>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-sky-500/15 text-sky-300'
                      : 'text-mist-300 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}

            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sky-400">Placement Hub</p>
            {placementNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-sky-500/15 text-sky-300'
                      : 'text-mist-300 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="truncate px-2 text-sm font-medium text-white">{user?.full_name || 'Administrator'}</p>
            <p className="truncate px-2 text-xs text-mist-400">Admin · {user?.email}</p>
            <button
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-mist-100 hover:bg-white/10"
              onClick={async () => {
                await logout()
                navigate('/admin/login')
              }}
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden">
            <div className="flex items-center gap-2">
              <Shield className="text-sky-400" size={18} />
              <span className="font-display font-semibold text-white">Admin</span>
            </div>
            <button
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-mist-200"
              onClick={async () => {
                await logout()
                navigate('/admin/login')
              }}
            >
              Sign out
            </button>
          </header>
          <nav className="flex gap-1 overflow-x-auto border-b border-white/10 px-2 py-2 lg:hidden">
            {[...nav, ...placementNav].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium',
                    isActive ? 'bg-sky-500/15 text-sky-300' : 'text-mist-400'
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
