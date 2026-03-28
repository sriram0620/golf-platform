'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDate } from '@/lib/utils'
import { Users, Search, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Profile } from '@/types'

interface UserWithSub extends Profile {
  subscription?: Array<{
    id: string
    plan: string
    status: string
    amount: number
    current_period_end: string | null
  }>
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithSub[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<UserWithSub | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', role: 'subscriber' as string, phone: '', country: '' })
  const [saving, setSaving] = useState(false)
  const limit = 20

  const load = async (p = page, q = search) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    if (q) params.set('search', q)
    const res = await fetch(`/api/admin/users?${params}`)
    const json = await res.json()
    setUsers(json.data?.users ?? [])
    setTotal(json.data?.total ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const onSearch = () => { setPage(1); load(1, search) }
  const prevPage = () => { const p = Math.max(1, page - 1); setPage(p); load(p) }
  const nextPage = () => { const p = page + 1; setPage(p); load(p) }

  const openEdit = (user: UserWithSub) => {
    setEditUser(user)
    setEditForm({
      full_name: user.full_name ?? '',
      role: user.role,
      phone: user.phone ?? '',
      country: user.country ?? '',
    })
  }

  const saveUser = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success('User updated')
      setEditUser(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <Button onClick={onSearch} variant="outline">
          <Search className="h-4 w-4" /> Search
        </Button>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl h-14 shimmer" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No users found</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Subscription</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Joined</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => {
                  const sub = user.subscription?.[0]
                  return (
                    <tr key={user.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-emerald-400">
                              {user.full_name?.charAt(0).toUpperCase() ?? 'U'}
                            </span>
                          </div>
                          <span className="text-white font-medium">{user.full_name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-400">{user.email}</td>
                      <td className="px-6 py-3">
                        <Badge status={user.role === 'admin' ? 'published' : 'active'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        {sub ? (
                          <div>
                            <Badge status={sub.status}>{sub.status}</Badge>
                            <span className="text-xs text-slate-500 ml-2">{sub.plan}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">No subscription</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-400 text-xs">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prevPage} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" onClick={nextPage} disabled={page >= totalPages}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        <div className="space-y-4">
          <Input
            label="Full name"
            value={editForm.full_name}
            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
          />
          <Select
            label="Role"
            value={editForm.role}
            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
          >
            <option value="subscriber">Subscriber</option>
            <option value="admin">Admin</option>
          </Select>
          <Input
            label="Phone"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <Input
            label="Country"
            value={editForm.country}
            onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
          />
          <div className="flex gap-3">
            <Button onClick={saveUser} loading={saving} className="flex-1">Save changes</Button>
            <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
