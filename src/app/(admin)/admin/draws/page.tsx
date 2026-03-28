'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatPounds, formatMonthYear, getMatchLabel } from '@/lib/utils'
import { Trophy, Plus, Play, Send, Eye, Hash } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Draw, DrawSimulationResult } from '@/types'

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [detailDraw, setDetailDraw] = useState<Draw | null>(null)
  const [detailEntries, setDetailEntries] = useState<Record<string, unknown>[]>([])
  const [detailWinners, setDetailWinners] = useState<Record<string, unknown>[]>([])
  const [simResult, setSimResult] = useState<DrawSimulationResult | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const [form, setForm] = useState({
    name: '',
    draw_month: new Date().getMonth() + 1,
    draw_year: new Date().getFullYear(),
    draw_type: 'random' as 'random' | 'algorithmic',
  })

  const load = async () => {
    const res = await fetch('/api/admin/draws')
    const json = await res.json()
    setDraws(json.data?.draws ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const createDraw = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success('Draw created')
      setCreateOpen(false)
      setForm({ name: '', draw_month: new Date().getMonth() + 1, draw_year: new Date().getFullYear(), draw_type: 'random' })
      load()
    } finally {
      setCreating(false)
    }
  }

  const openDetail = async (draw: Draw) => {
    const res = await fetch(`/api/admin/draws/${draw.id}`)
    const json = await res.json()
    setDetailDraw(json.data?.draw ?? draw)
    setDetailEntries(json.data?.entries ?? [])
    setDetailWinners(json.data?.winners ?? [])
    setSimResult(null)
  }

  const simulate = async (drawType?: string) => {
    if (!detailDraw) return
    setSimulating(true)
    try {
      const res = await fetch(`/api/admin/draws/${detailDraw.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate', draw_type: drawType ?? detailDraw.draw_type }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      setSimResult(json.data?.simulation ?? null)
      toast.success('Simulation complete')
      load()
      openDetail(detailDraw)
    } finally {
      setSimulating(false)
    }
  }

  const publish = async () => {
    if (!detailDraw) return
    if (!confirm('Publish this draw? This will create winner records and send notifications.')) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/admin/draws/${detailDraw.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success(`Draw published! ${json.data?.winners_count ?? 0} winner(s)`)
      setDetailDraw(null)
      load()
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Draws</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage monthly prize draws</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Draw
        </Button>
      </div>

      {/* Draws list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-32 shimmer" />)}
        </div>
      ) : draws.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">No draws yet</h3>
          <p className="text-slate-400 text-sm mb-4">Create your first monthly draw.</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create Draw
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {draws.map((draw) => (
            <div key={draw.id} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-white">{draw.name}</h3>
                  <p className="text-sm text-slate-400">
                    {formatMonthYear(draw.draw_month, draw.draw_year)} · {draw.draw_type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={draw.status}>{draw.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => openDetail(draw)}>
                    <Eye className="h-3.5 w-3.5" /> Details
                  </Button>
                </div>
              </div>

              {draw.drawn_numbers?.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {draw.drawn_numbers.map((n, i) => (
                    <div key={i} className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                      {n}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-white/3 rounded-lg py-2">
                  <p className="font-bold text-white">{formatPounds(draw.total_pool)}</p>
                  <p className="text-slate-500">Total Pool</p>
                </div>
                <div className="bg-amber-500/5 rounded-lg py-2">
                  <p className="font-bold text-amber-400">{formatPounds(draw.five_match_pool)}</p>
                  <p className="text-slate-500">5-Match</p>
                </div>
                <div className="bg-emerald-500/5 rounded-lg py-2">
                  <p className="font-bold text-emerald-400">{formatPounds(draw.four_match_pool)}</p>
                  <p className="text-slate-500">4-Match</p>
                </div>
                <div className="bg-blue-500/5 rounded-lg py-2">
                  <p className="font-bold text-blue-400">{formatPounds(draw.three_match_pool)}</p>
                  <p className="text-slate-500">3-Match</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs text-slate-500">
                <span>{draw.participant_count} participants</span>
                {draw.jackpot_rollover > 0 && (
                  <span className="text-amber-400">Jackpot rollover: {formatPounds(draw.jackpot_rollover)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Draw">
        <div className="space-y-4">
          <Input
            label="Draw name"
            placeholder="e.g. March 2026 Draw"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Month"
              value={form.draw_month}
              onChange={(e) => setForm({ ...form, draw_month: parseInt(e.target.value) })}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </Select>
            <Input
              label="Year"
              type="number"
              min={2024}
              value={form.draw_year}
              onChange={(e) => setForm({ ...form, draw_year: parseInt(e.target.value) })}
            />
          </div>
          <Select
            label="Draw type"
            value={form.draw_type}
            onChange={(e) => setForm({ ...form, draw_type: e.target.value as 'random' | 'algorithmic' })}
          >
            <option value="random">Random — standard lottery-style</option>
            <option value="algorithmic">Algorithmic — weighted by frequency</option>
          </Select>
          <div className="flex gap-3">
            <Button onClick={createDraw} loading={creating} className="flex-1">Create draw</Button>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={!!detailDraw}
        onClose={() => setDetailDraw(null)}
        title={detailDraw?.name ?? 'Draw Details'}
        className="max-w-2xl"
      >
        {detailDraw && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge status={detailDraw.status}>{detailDraw.status}</Badge>
              <span className="text-sm text-slate-400">
                {formatMonthYear(detailDraw.draw_month, detailDraw.draw_year)} · {detailDraw.draw_type}
              </span>
            </div>

            {/* Drawn numbers */}
            {detailDraw.drawn_numbers?.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-2">Drawn numbers:</p>
                <div className="flex gap-2">
                  {detailDraw.drawn_numbers.map((n, i) => (
                    <div key={i} className="h-11 w-11 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-400">
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Entries */}
            <div>
              <p className="text-sm font-medium text-white mb-2">
                Entries ({detailEntries.length})
              </p>
              {detailEntries.length === 0 ? (
                <p className="text-sm text-slate-500">No entries yet.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {detailEntries.map((entry) => (
                    <div key={entry.id as string} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2 text-sm">
                      <span className="text-slate-300">
                        {(entry.profile as Record<string, string>)?.full_name ?? 'Unknown'}
                      </span>
                      <div className="flex gap-1">
                        {(entry.score_snapshot as number[]).map((n, i) => (
                          <span key={i} className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center text-xs text-slate-400">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Winners */}
            {detailWinners.length > 0 && (
              <div>
                <p className="text-sm font-medium text-white mb-2">Winners</p>
                <div className="space-y-2">
                  {detailWinners.map((w) => (
                    <div key={w.id as string} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2 text-sm">
                      <div>
                        <span className="text-white">{(w.profile as Record<string, string>)?.full_name ?? 'Unknown'}</span>
                        <span className="text-slate-500 ml-2">{getMatchLabel(w.match_type as string)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-semibold">{formatPounds(w.prize_amount as number)}</span>
                        <Badge status={w.status as string}>{w.status as string}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simulation result */}
            {simResult && (
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-purple-400 mb-2">Simulation Result</p>
                <div className="flex gap-2 mb-2">
                  {simResult.drawn_numbers.map((n, i) => (
                    <div key={i} className="h-9 w-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
                      {n}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>5-Match winners: {simResult.five_match_count}</p>
                  <p>4-Match winners: {simResult.four_match_count}</p>
                  <p>3-Match winners: {simResult.three_match_count}</p>
                  <p>Total winners: {simResult.winners.length}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            {detailDraw.status !== 'published' && (
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <Button
                  variant="secondary"
                  onClick={() => simulate()}
                  loading={simulating}
                  className="flex-1"
                >
                  <Play className="h-4 w-4" /> Run Simulation
                </Button>
                {detailDraw.drawn_numbers?.length > 0 && (
                  <Button
                    onClick={publish}
                    loading={publishing}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4" /> Publish Draw
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
