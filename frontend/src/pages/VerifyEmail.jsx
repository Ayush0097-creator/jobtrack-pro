import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/client'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState(token ? 'loading' : 'missing')

  useEffect(() => {
    if (!token) return
    api
      .post('/auth/verify-email/', { token })
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-fade px-4">
      <div className="glass-card w-full max-w-md p-8 text-center">
        <h1 className="font-display text-2xl text-white">Email verification</h1>
        <p className="mt-4 text-sm text-mist-300">
          {status === 'loading' && 'Verifying…'}
          {status === 'ok' && 'Your email is verified.'}
          {status === 'error' && 'Invalid or expired token.'}
          {status === 'missing' && 'No token provided.'}
        </p>
        <Link to="/student/login" className="btn-primary mt-6 inline-flex">
          Continue
        </Link>
      </div>
    </div>
  )
}
