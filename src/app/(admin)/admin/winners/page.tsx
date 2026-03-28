'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatPounds, formatMonthYear, getMatchLabel } from '@/lib/utils'
import { Award, CheckCircle2, XCircle, Banknote, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface WinnerRow {
  id: string
  user_id: string
  draw_id: string
  match_type: string
  matched_numbers: number[]
  prize_amount: number
  status: string
  proof_url: string | null
  admin_notes: string | null
  profile?: { id: string; full_name: string; email: string }
  draw?: { id: string; name: string; draw_month: number; draw_year: number }
}

const STATUS_TABS = ['all', 'pending', 'verified', 'rejected', 'paid'] as const

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<WinnerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [actionModal, setActionModal] = useState<WinnerRow | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async (status?: string) => {
    setLoading(true)
    const params = status && status !== 'all' ? `?status=${status}` : ''
    const res = await fetch(`/api/admin/winners${params}`)
    const json = await res.json()
    setWinners(json.data?.winners ?? [])
    setLoading(false)
  }

  useEffect(() => { load(statusFilter) }, [statusFilter])

  const openAction = (winner: WinnerRow) => {
    setActionModal(winner)
    setNewStatus(winner.status)
    setAdminNotes(winner.admin_notes ?? '')
  }

  const updateStatus = async () => {
    if (!actionModal || !newStatus) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/winners/${actionModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, admin_notes: adminNotes || undefined }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success('Winner status updated')
      setActionModal(null)
      load(statusFilter)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Winners</h1>
        <p className="text-slate-400 text-sm mt-0.5">Verify and manage winners</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize cursor-pointer ${
              statusFilter === tab
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/3 text-slate-400 border border-white/5 hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-xl h-20 shimmer" />)}
        </div>
      ) : winners.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Award className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No {statusFilter !== 'all' ? statusFilter : ''} winners found</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Winner</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Draw</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Match</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Prize</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Proof</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {winners.map((winner) => (
                  <tr key={winner.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-3">
                      <p className="text-white font-medium">{winner.profile?.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{winner.profile?.email}</p>
                    </td>
                    <td className="px-6 py-3 text-slate-400 text-xs">
                      {winner.draw ? (
                        <>
                          {winner.draw.name}
                          <br />
                          <span className="text-slate-500">
                            {formatMonthYear(winner.draw.draw_month, winner.draw.draw_year)}
                          </span>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-white text-xs">{getMatchLabel(winner.match_type)}</p>
                      <div className="flex gap-1 mt-1">
                        {winner.matched_numbers.map((n, i) => (
                          <span key={i} className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs text-emerald-400">
                            {n}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-emerald-400 font-semibold">
                      {formatPounds(winner.prize_amount)}
                    </td>
                    <td className="px-6 py-3">
                      {winner.proof_url ? (
                        <a
                          href={winner.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Badge status={winner.status}>{winner.status}</Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openAction(winner)}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title="Manage Winner">
        {actionModal && (
          <div className="space-y-4">
            <div className="bg-white/3 rounded-xl p-4">
              <p className="text-sm text-white font-medium">{actionModal.profile?.full_name}</p>
              <p className="text-xs text-slate-500">{actionModal.profile?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-emerald-400 font-bold">{formatPounds(actionModal.prize_amount)}</span>
                <span className="text-xs text-slate-500">{getMatchLabel(actionModal.match_type)}</span>
              </div>
              {actionModal.proof_url && (
                <a
                  href={actionModal.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-blue-400 text-sm hover:text-blue-300"
                >
                  View proof <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            <Select
              label="Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
            </Select>

            <Input
              label="Admin notes"
              placeholder="Optional notes for the winner…"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />

            <div className="flex gap-3">
              <Button onClick={updateStatus} loading={saving} className="flex-1">
                Update status
              </Button>
              <Button variant="ghost" onClick={() => setActionModal(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
