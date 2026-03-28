'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { formatPounds, formatMonthYear, getMatchLabel } from '@/lib/utils'
import { Trophy, Upload, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Winner } from '@/types'

export default function WinningsPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [proofModal, setProofModal] = useState<Winner | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    const res = await fetch('/api/winners')
    const json = await res.json()
    setWinners(json.data?.winners ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const submitProof = async () => {
    if (!proofModal || !proofUrl) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/winners/${proofModal.id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof_url: proofUrl }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success('Proof submitted for review!')
      setProofModal(null)
      setProofUrl('')
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const totalWon = winners.reduce((sum, w) => sum + w.prize_amount, 0)
  const totalPaid = winners.filter((w) => w.status === 'paid').reduce((sum, w) => sum + w.prize_amount, 0)

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-24 shimmer" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Winnings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Your prize history and verification status</p>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-slate-400 mb-1">Total won</p>
          <p className="text-3xl font-black text-emerald-400">{formatPounds(totalWon)}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-slate-400 mb-1">Total paid out</p>
          <p className="text-3xl font-black text-blue-400">{formatPounds(totalPaid)}</p>
        </div>
      </div>

      {winners.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">No winnings yet</h3>
          <p className="text-slate-400 text-sm">Keep entering draws — your numbers may come up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {winners.map((winner) => (
            <div key={winner.id} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold text-white">
                      {winner.draw ? formatMonthYear((winner.draw as { draw_month: number; draw_year: number }).draw_month, (winner.draw as { draw_month: number; draw_year: number }).draw_year) : 'Draw'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{getMatchLabel(winner.match_type)}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {winner.matched_numbers.map((n, i) => (
                      <span key={i} className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-black text-emerald-400 mb-1">{formatPounds(winner.prize_amount)}</p>
                  <Badge status={winner.status}>{winner.status}</Badge>
                </div>
              </div>

              {winner.status === 'pending' && !winner.proof_url && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-sm text-amber-400 mb-2 flex items-center gap-1.5">
                    <Upload className="h-4 w-4" />
                    Verification required — upload your proof of scores
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setProofModal(winner)}>
                    Submit proof
                  </Button>
                </div>
              )}

              {winner.proof_url && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Proof submitted — awaiting admin review
                </div>
              )}

              {winner.admin_notes && (
                <div className="mt-3 p-3 rounded-lg bg-white/3 text-sm text-slate-300">
                  <span className="text-slate-500 text-xs">Admin note: </span>
                  {winner.admin_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!proofModal} onClose={() => setProofModal(null)} title="Submit verification proof">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Please provide a URL to a screenshot from your golf platform showing your scores. The admin team will review your submission.
          </p>
          <Input
            label="Screenshot URL"
            type="url"
            placeholder="https://..."
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
          />
          <div className="flex gap-3">
            <Button onClick={submitProof} loading={submitting} className="flex-1">
              Submit proof
            </Button>
            <Button variant="ghost" onClick={() => setProofModal(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
