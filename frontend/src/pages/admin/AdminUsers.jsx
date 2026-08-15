import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui/Primitives'
import { errorMessage } from '../../lib/utils'

export default function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const q = search ? `?search=${encodeURIComponent(search)}` : ''
      return (await api.get(`/auth/admin/users/${q}`)).data
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/auth/admin/users/${id}/`, payload),
    onSuccess: () => {
      toast.success('User updated')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-analytics'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const users = data?.results || data || []

  return (
    <div>
      <PageHeader title="Students & users" subtitle="Activate, deactivate, and review student accounts" />
      <input
        className="input mb-4 max-w-md"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" description="Create a student account from the student portal." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-mist-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Academic Info</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Apps</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{u.full_name || u.username}</p>
                    <p className="text-xs text-mist-400">{u.email}</p>
                    {u.college && <p className="text-[11px] text-mist-500">{u.college}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-mist-300">
                    {u.branch ? (
                      <div>
                        <span className="font-semibold text-white">{u.branch}</span>
                        {u.graduation_year && <span> · Batch {u.graduation_year}</span>}
                        <div>
                          <span>CGPA: <span className="text-sky-300 font-mono">{u.cgpa ?? 'N/A'}</span></span>
                          {u.backlogs !== undefined && (
                            <span className={u.backlogs > 0 ? 'text-amber-400 ml-2' : 'text-mist-400 ml-2'}>
                              · {u.backlogs} backlogs
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-mist-500 italic">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-mist-200">{u.role}</td>
                  <td className="px-4 py-3 font-mono text-sky-300">{u.application_count ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs ${
                        u.is_active ? 'bg-accent/15 text-accent' : 'bg-red-500/15 text-red-300'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-white/10 px-2 py-1 text-xs text-mist-200 hover:bg-white/5"
                        onClick={() =>
                          updateMut.mutate({ id: u.id, payload: { is_active: !u.is_active } })
                        }
                      >
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                      {u.role === 'student' && (
                        <button
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-sky-300 hover:bg-white/5"
                          onClick={() => updateMut.mutate({ id: u.id, payload: { role: 'admin' } })}
                        >
                          Make admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
