'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatPounds } from '@/lib/utils'
import { Settings, User, CreditCard, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { hasSubscriptionAccess } from '@/lib/subscription-access'
import type { Profile, Subscription } from '@/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', country: '' })

  useEffect(() => {
    const load = async () => {
      const [meRes, subRes] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/subscriptions', { cache: 'no-store', credentials: 'include' }),
      ])
      const meJson = await meRes.json()
      const subJson = await subRes.json()
      const p = meJson.data?.profile
      setProfile(p)
      setSubscription(subJson.data?.subscription ?? null)
      if (p) {
        setForm({
          full_name: p.full_name ?? '',
          phone: p.phone ?? '',
          country: p.country ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      setProfile(json.data.profile)
      toast.success('Profile updated')
    } finally {
      setSaving(false)
    }
  }

  const cancelSub = async () => {
    if (!confirm('Cancel your subscription? You will lose access at the end of your current billing period.')) return
    setCancelling(true)
    try {
      const res = await fetch('/api/subscriptions/cancel', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      setSubscription(json.data.subscription)
      toast.success('Subscription cancelled')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-32 shimmer" />)}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your profile and subscription</p>
      </div>

      {/* Profile */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="h-5 w-5 text-emerald-400" />
          <h2 className="font-semibold text-white">Profile</h2>
        </div>
        <div className="space-y-4 max-w-md">
          <Input
            label="Email"
            value={profile?.email ?? ''}
            disabled
          />
          <Input
            label="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Optional"
          />
          <Select
            label="Country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          >
            <option value="GB">United Kingdom</option>
            <option value="IE">Ireland</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
          </Select>
          <Button onClick={saveProfile} loading={saving}>Save profile</Button>
        </div>
      </div>

      {/* Subscription */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          <h2 className="font-semibold text-white">Subscription</h2>
        </div>

        {subscription ? (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Status</p>
                <Badge status={subscription.status}>{subscription.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Plan</p>
                <p className="text-white font-medium capitalize">{subscription.plan}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Amount</p>
                <p className="text-white font-medium">{formatPounds(subscription.amount)}</p>
              </div>
              {subscription.current_period_end && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">
                    {subscription.status === 'cancelled' ? 'Expires' : 'Renews'}
                  </p>
                  <p className="text-white font-medium">{formatDate(subscription.current_period_end)}</p>
                </div>
              )}
            </div>

            {hasSubscriptionAccess(subscription.status) && (
              <div className="pt-4 border-t border-white/5">
                <Button variant="danger" onClick={cancelSub} loading={cancelling} size="sm">
                  <AlertTriangle className="h-4 w-4" /> Cancel subscription
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                  You'll retain access until the end of your current billing period.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm mb-3">No active subscription</p>
            <a href="/pricing">
              <Button size="sm">View plans</Button>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
