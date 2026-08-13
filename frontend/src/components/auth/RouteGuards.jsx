import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, homeForUser, isAdminUser } from '../../api/auth'
import StudentShell from '../layout/StudentShell'
import AdminShell from '../layout/AdminShell'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-fade">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  )
}

export function StudentRoute() {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to="/student/login" replace state={{ from: location }} />
  }
  if (isAdminUser(user)) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <StudentShell>
      <Outlet />
    </StudentShell>
  )
}

export function AdminRoute() {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }
  if (!isAdminUser(user)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  )
}

export function PublicOnlyRoute({ portal = 'student' }) {
  const { isAuthenticated, loading, user } = useAuth()
  if (loading) return null
  if (isAuthenticated) {
    return <Navigate to={homeForUser(user)} replace />
  }
  return <Outlet />
}

/** @deprecated use StudentRoute */
export function ProtectedRoute() {
  return <StudentRoute />
}
