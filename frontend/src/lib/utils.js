import { clsx } from 'clsx'

export function cn(...args) {
  return clsx(args)
}

export function formatPercent(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return `${Number(n).toFixed(n % 1 ? 1 : 0)}%`
}

export function errorMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data
  if (!data) return err?.message || fallback
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  const first = Object.values(data)[0]
  if (Array.isArray(first)) return first[0]
  if (typeof first === 'string') return first
  return fallback
}
