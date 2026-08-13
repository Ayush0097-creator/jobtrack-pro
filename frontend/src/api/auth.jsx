import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from './client'

const AuthContext = createContext(null)

export function isAdminUser(user) {
  if (!user) return false
  return user.is_admin || user.role === 'admin' || user.is_staff
}

export function homeForUser(user) {
  return isAdminUser(user) ? '/admin/dashboard' : '/app/dashboard'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(!!localStorage.getItem('access'))

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/profile/')
      .then(({ data }) => {
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
      })
      .catch(() => {
        setUser(null)
        localStorage.removeItem('user')
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
      })
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: isAdminUser(user),
      isStudent: !!user && !isAdminUser(user),
      async login(email, password, { portal = 'student' } = {}) {
        const endpoint = portal === 'admin' ? '/auth/admin/login/' : '/auth/login/'
        const { data } = await api.post(endpoint, { email, password })
        localStorage.setItem('access', data.access)
        localStorage.setItem('refresh', data.refresh)
        const profile = data.user || (await api.get('/auth/profile/')).data
        setUser(profile)
        localStorage.setItem('user', JSON.stringify(profile))
        return profile
      },
      async register(payload) {
        const { data } = await api.post('/auth/register/', payload)
        localStorage.setItem('access', data.access)
        localStorage.setItem('refresh', data.refresh)
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        return data
      },
      async logout() {
        const refresh = localStorage.getItem('refresh')
        try {
          if (refresh) await api.post('/auth/logout/', { refresh })
        } catch {
          /* ignore */
        }
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        localStorage.removeItem('user')
        setUser(null)
      },
      async refreshProfile() {
        const { data } = await api.get('/auth/profile/')
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
        return data
      },
      setUser,
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
