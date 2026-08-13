import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Briefcase,
  Sparkles,
  KanbanSquare,
  LineChart,
  GraduationCap,
  Shield,
  FileText,
  CalendarDays,
} from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-grid-fade">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Briefcase size={20} />
          </div>
          <span className="font-display text-xl font-semibold text-white">JobTrack Pro</span>
        </div>
        <div className="flex gap-2">
          <Link to="/student/login" className="btn-ghost">
            Student sign in
          </Link>
          <Link to="/admin/login" className="btn-ghost">
            Admin
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-12">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45,212,168,0.18), transparent)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-3xl"
        >
          <p className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
            JobTrack Pro
          </p>
          <h1 className="mt-5 max-w-2xl text-xl text-mist-200 sm:text-2xl">
            Centralized placement platform — applications, resumes, interviews, analytics, and AI insights.
          </h1>
          <p className="mt-4 max-w-xl text-mist-400">
            Two dedicated portals: students manage their job search; admins monitor the entire placement pipeline.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55 }}
          className="relative mt-12 grid gap-5 md:grid-cols-2"
        >
          <div className="glass-card flex flex-col p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <GraduationCap size={24} />
            </div>
            <p className="mt-5 font-display text-2xl font-semibold text-white">Student Portal</p>
            <p className="mt-2 text-sm leading-relaxed text-mist-300">
              Track applications, manage resumes, monitor interviews, analyze stats, run AI match scores, and prepare for placements.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-mist-400">
              <li className="flex items-center gap-2"><KanbanSquare size={14} className="text-accent" /> Application pipeline & Kanban</li>
              <li className="flex items-center gap-2"><FileText size={14} className="text-accent" /> Resume ATS + versioning</li>
              <li className="flex items-center gap-2"><CalendarDays size={14} className="text-accent" /> Interview tracker & prep</li>
              <li className="flex items-center gap-2"><Sparkles size={14} className="text-accent" /> AI insights & job match</li>
              <li className="flex items-center gap-2"><LineChart size={14} className="text-accent" /> Personal placement analytics</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link to="/student/register" className="btn-primary">
                Create student account <ArrowRight size={16} />
              </Link>
              <Link to="/student/login" className="btn-ghost">
                Student sign in
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-500/20 bg-[#0c1220]/80 p-7 shadow-glass backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
              <Shield size={24} />
            </div>
            <p className="mt-5 font-display text-2xl font-semibold text-white">Admin Console</p>
            <p className="mt-2 text-sm leading-relaxed text-mist-300">
              Separate operations workspace to manage students, review all applications, and monitor AI usage across the platform.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-mist-400">
              <li className="flex items-center gap-2"><UsersIcon /> View & manage users</li>
              <li className="flex items-center gap-2"><Briefcase size={14} className="text-sky-400" /> Platform-wide applications</li>
              <li className="flex items-center gap-2"><LineChart size={14} className="text-sky-400" /> Aggregate analytics</li>
              <li className="flex items-center gap-2"><Sparkles size={14} className="text-sky-400" /> AI usage monitoring</li>
            </ul>
            <div className="mt-8">
              <Link
                to="/admin/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-ink-950 hover:bg-sky-400"
              >
                Admin sign in <ArrowRight size={16} />
              </Link>
              <p className="mt-3 text-xs text-mist-400">Admin accounts are created via Django superuser — not public signup.</p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
