import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

export function StatCard({ label, value, suffix = '', hint }) {
  const spring = useSpring(0, { stiffness: 70, damping: 18 })
  const rounded = useTransform(spring, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    spring.set(Number(value) || 0)
  }, [value, spring])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-mist-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-white">
        <motion.span>{rounded}</motion.span>
        {suffix}
      </p>
      {hint && <p className="mt-1 text-xs text-mist-400">{hint}</p>}
    </motion.div>
  )
}

export function PageHeader({ title, subtitle, actions, action }) {
  const actionContent = actions || action
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-mist-300">{subtitle}</p>}
      </div>
      {actionContent && <div className="flex flex-wrap gap-2">{actionContent}</div>}
    </div>
  )
}

export function Skeleton({ className = 'h-24' }) {
  return <div className={`animate-pulse rounded-2xl bg-white/5 ${className}`} />
}

export function EmptyState({ title, description, message, action }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-display text-xl text-white">{title}</p>
      <p className="mt-2 max-w-md text-sm text-mist-400">{description || message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
