'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, CheckCircle2, ExternalLink } from 'lucide-react'
import { formatPounds } from '@/lib/utils'
import toast from 'react-hot-toast'
import { hasSubscriptionAccess } from '@/lib/subscription-access'
import type { Charity, Subscription } from '@/types'

export default function CharityPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [charities, setCharities] = useState<Charity[]>([])
  const [selected, setSelected] = useState<string>('')
  const [percentage, setPercentage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [subRes, charRes] = await Promise.all([
        fetch('/api/subscriptions', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/charities', { cache: 'no-store', credentials: 'include' }),
      ])
      const subJson = await subRes.json()
      const charJson = await charRes.json()
      const sub = subJson.data?.subscription
      setSubscription(sub)
      setSelected(sub?.charity_id ?? '')
      setPercentage(sub?.charity_percentage ?? 10)
      setCharities(charJson.data?.charities ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    if (!selected) { toast.error('Please select a charity'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/subscriptions/charity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ charity_id: selected, charity_percentage: percentage }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      setSubscription(json.data.subscription)
      toast.success('Charity preferences saved!')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-24 shimmer" />)}
      </div>
    )
  }

  if (!subscription || !hasSubscriptionAccess(subscription.status)) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <Heart className="h-12 w-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-1">Subscription required</h3>
        <p className="text-slate-400 text-sm">An active subscription is needed to manage charity preferences.</p>
      </div>
    )
  }

  const monthlyContribution = (subscription.amount * percentage) / 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Charity</h1>
        <p className="text-slate-400 text-sm mt-0.5">Choose where your contribution goes</p>
      </div>

      {/* Contribution summary */}
      <div className="glass rounded-2xl p-6 border border-emerald-500/20 glow-emerald">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Your contribution</h2>
          <Heart className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-3xl font-black text-emerald-400">{formatPounds(monthlyContribution)}</p>
            <p className="text-sm text-slate-400">per month to charity</p>
          </div>
          <div className="flex-1">
            <label className="text-sm text-slate-400 block mb-2">
              Charity percentage: <span className="text-white font-semibold">{percentage}%</span>
            </label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>10% (minimum)</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charity selection */}
      <div>
        <h2 className="font-semibold text-white mb-4">Select a charity</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {charities.map((charity) => (
            <button
              key={charity.id}
              onClick={() => setSelected(charity.id)}
              className={`text-left glass rounded-xl p-4 transition-all cursor-pointer ${
                selected === charity.id
                  ? 'border border-emerald-500/40 bg-emerald-500/5'
                  : 'hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-medium text-white text-sm">{charity.name}</span>
                </div>
                {selected === charity.id && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {charity.short_description ?? charity.description}
              </p>
              {charity.category && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-500">
                  {charity.category}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={save} loading={saving} size="lg">
        Save preferences
      </Button>
    </div>
  )
}
