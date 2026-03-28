'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Target, Plus, Pencil, Trash2, Info } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import type { GolfScore } from '@/types'

const schema = z.object({
  score: z.number().int().min(1, 'Min 1').max(45, 'Max 45'),
  played_date: z.string().min(1, 'Date required'),
  notes: z.string().max(500).optional(),
})
type FormData = { score: number; played_date: string; notes?: string }

export default function ScoresPage() {
  const [scores, setScores] = useState<GolfScore[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingScore, setEditingScore] = useState<GolfScore | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { played_date: new Date().toISOString().split('T')[0] },
  })

  const loadScores = async () => {
    const res = await fetch('/api/scores')
    const json = await res.json()
    setScores(json.data?.scores ?? [])
    setLoading(false)
  }

  useEffect(() => { loadScores() }, [])

  const openAdd = () => {
    setEditingScore(null)
    reset({ played_date: new Date().toISOString().split('T')[0], score: undefined, notes: '' })
    setModalOpen(true)
  }

  const openEdit = (score: GolfScore) => {
    setEditingScore(score)
    reset({ score: score.score, played_date: score.played_date, notes: score.notes ?? '' })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const url = editingScore ? `/api/scores/${editingScore.id}` : '/api/scores'
      const method = editingScore ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success(editingScore ? 'Score updated' : 'Score added')
      setModalOpen(false)
      loadScores()
    } finally {
      setSubmitting(false)
    }
  }

  const deleteScore = async (id: string) => {
    if (!confirm('Delete this score?')) return
    const res = await fetch(`/api/scores/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Score deleted'); loadScores() }
    else toast.error('Failed to delete score')
  }

  const avg = scores.length ? Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Scores</h1>
          <p className="text-slate-400 text-sm mt-0.5">Stableford format · Rolling 5-score limit</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add score
        </Button>
      </div>

      {/* Info banner */}
      <div className="glass rounded-xl p-4 flex items-start gap-3 border border-blue-500/20 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-300">
          Only your latest 5 scores are kept. Adding a 6th automatically removes the oldest. Scores are used as your entry numbers in monthly draws.
        </p>
      </div>

      {/* Score summary */}
      {scores.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-400">{scores[0]?.score ?? '—'}</p>
            <p className="text-xs text-slate-500 mt-1">Latest score</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-blue-400">{avg}</p>
            <p className="text-xs text-slate-500 mt-1">Average</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-white">{scores.length}<span className="text-lg text-slate-500">/5</span></p>
            <p className="text-xs text-slate-500 mt-1">Scores logged</p>
          </div>
        </div>
      )}

      {/* Score list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-xl h-16 shimmer" />
          ))}
        </div>
      ) : scores.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Target className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">No scores yet</h3>
          <p className="text-slate-400 text-sm mb-4">Add your Stableford scores to enter monthly draws.</p>
          <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add first score</Button>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {scores.map((score, i) => (
              <div key={score.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white">{score.score}</span>
                    <span className="text-xs text-slate-500">points</span>
                    {i === 0 && <Badge status="active" className="text-xs">Latest</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">{formatDate(score.played_date)}</p>
                  {score.notes && <p className="text-xs text-slate-400 mt-0.5">{score.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(score)}
                    className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteScore(score.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score entry numbers for draw */}
      {scores.length > 0 && (
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-400 mb-3">Your draw entry numbers:</p>
          <div className="flex flex-wrap gap-2">
            {scores.map((s) => (
              <div key={s.id} className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                {s.score}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingScore ? 'Edit score' : 'Add score'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Stableford score (1–45)"
            type="number"
            min={1}
            max={45}
            placeholder="e.g. 32"
            error={errors.score?.message}
            {...register('score')}
          />
          <Input
            label="Date played"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            error={errors.played_date?.message}
            {...register('played_date')}
          />
          <Input
            label="Notes (optional)"
            placeholder="Course, weather, etc."
            error={errors.notes?.message}
            {...register('notes')}
          />
          <div className="flex gap-3">
            <Button type="submit" loading={submitting} className="flex-1">
              {editingScore ? 'Update' : 'Save score'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
