'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/ui/stat-card'
import { formatPounds } from '@/lib/utils'
import { Users, CreditCard, Trophy, Heart, BarChart3, AlertCircle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import type { AdminStats } from '@/types'

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [signupData, setSignupData] = useState<{ month: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/admin/analytics')
      const json = await res.json()
      if (json.data) {
        setStats(json.data.stats)

        // Process monthly signups
        const signups = json.data.monthly_signups ?? []
        const monthly = new Map<string, number>()
        for (const s of signups) {
          const d = new Date(s.created_at)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          monthly.set(key, (monthly.get(key) ?? 0) + 1)
        }
        const sorted = [...monthly.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({
            month: new Date(month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
            count,
          }))
        setSignupData(sorted)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl h-28 shimmer" />)}
        </div>
        <div className="glass rounded-2xl h-80 shimmer" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-0.5">Platform reports and statistics</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={stats?.total_users ?? 0} icon={Users} color="blue" />
        <StatCard title="Active Subscribers" value={stats?.active_subscribers ?? 0} icon={CreditCard} color="emerald" />
        <StatCard title="Total Prize Pool" value={formatPounds(stats?.total_prize_pool ?? 0)} icon={Trophy} color="amber" />
        <StatCard title="Charity Contributions" value={formatPounds(stats?.total_charity_contributions ?? 0)} icon={Heart} color="purple" />
        <StatCard title="Total Draws" value={stats?.total_draws ?? 0} icon={BarChart3} color="blue" />
        <StatCard title="Pending Verifications" value={stats?.pending_verifications ?? 0} icon={AlertCircle} color="amber" />
      </div>

      {/* Signup trend chart */}
      {signupData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-6">User Signups</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signupData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Conversion stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-3xl font-black text-emerald-400">
            {stats && stats.total_users > 0
              ? `${Math.round((stats.active_subscribers / stats.total_users) * 100)}%`
              : '0%'}
          </p>
          <p className="text-sm text-slate-400 mt-1">Conversion rate</p>
          <p className="text-xs text-slate-500 mt-0.5">Users → Subscribers</p>
        </div>
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-3xl font-black text-amber-400">
            {stats?.active_subscribers
              ? formatPounds(stats.total_prize_pool / (stats.total_draws || 1))
              : '£0'}
          </p>
          <p className="text-sm text-slate-400 mt-1">Avg. pool per draw</p>
        </div>
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-3xl font-black text-purple-400">
            {stats?.active_subscribers
              ? formatPounds(stats.total_charity_contributions / (stats.active_subscribers || 1))
              : '£0'}
          </p>
          <p className="text-sm text-slate-400 mt-1">Avg. charity per subscriber</p>
        </div>
      </div>
    </div>
  )
}
