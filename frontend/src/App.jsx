import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './api/auth'
import { StudentRoute, AdminRoute, PublicOnlyRoute } from './components/auth/RouteGuards'
import Landing from './pages/Landing'
import StudentLogin from './pages/StudentLogin'
import StudentRegister from './pages/StudentRegister'
import AdminLogin from './pages/AdminLogin'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import ApplicationDetail from './pages/ApplicationDetail'
import Board from './pages/Board'
import Interviews from './pages/Interviews'
import Resumes from './pages/Resumes'
import AITools from './pages/AITools'
import Coach from './pages/Coach'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminApplications from './pages/admin/AdminApplications'
import AdminAIUsage from './pages/admin/AdminAIUsage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/student/register" element={<StudentRegister />} />
              <Route path="/login" element={<Navigate to="/student/login" replace />} />
              <Route path="/register" element={<Navigate to="/student/register" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route element={<StudentRoute />}>
              <Route path="/app/dashboard" element={<Dashboard />} />
              <Route path="/app/applications" element={<Applications />} />
              <Route path="/app/applications/:id" element={<ApplicationDetail />} />
              <Route path="/app/board" element={<Board />} />
              <Route path="/app/interviews" element={<Interviews />} />
              <Route path="/app/resumes" element={<Resumes />} />
              <Route path="/app/ai" element={<AITools />} />
              <Route path="/app/coach" element={<Coach />} />
              <Route path="/app/profile" element={<Profile />} />
              <Route path="/app/notifications" element={<Notifications />} />
              {/* legacy redirects */}
              <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="/applications" element={<Navigate to="/app/applications" replace />} />
              <Route path="/board" element={<Navigate to="/app/board" replace />} />
              <Route path="/interviews" element={<Navigate to="/app/interviews" replace />} />
              <Route path="/resumes" element={<Navigate to="/app/resumes" replace />} />
              <Route path="/ai" element={<Navigate to="/app/ai" replace />} />
              <Route path="/coach" element={<Navigate to="/app/coach" replace />} />
              <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
              <Route path="/notifications" element={<Navigate to="/app/notifications" replace />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/applications" element={<AdminApplications />} />
              <Route path="/admin/ai-usage" element={<AdminAIUsage />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#121826',
              color: '#F4F7FB',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
