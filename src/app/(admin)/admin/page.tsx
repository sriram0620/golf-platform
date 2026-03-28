'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { formatPounds, formatMonthYear, getMatchLabel } from '@/lib/utils'
import {
  Users, CreditCard, Trophy, Heart,
  AlertCircle, BarChart3, TrendingUp
} from 'lucide-react'
import type { AdminStats, Winner } from '@/types'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentWinners, setRecentWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/admin/analytics')
      const json = await res.json()
      if (json.data) {
        setStats(json.data.stats)
        setRecentWinners(json.data.recent_winners ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-2xl h-28 shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.total_users ?? 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Subscribers"
          value={stats?.active_subscribers ?? 0}
          icon={CreditCard}
          color="emerald"
        />
        <StatCard
          title="Total Prize Pool"
          value={formatPounds(stats?.total_prize_pool ?? 0)}
          icon={Trophy}
          color="amber"
        />
        <StatCard
          title="Charity Contributions"
          value={formatPounds(stats?.total_charity_contributions ?? 0)}
          icon={Heart}
          color="purple"
        />
        <StatCard
          title="Total Draws"
          value={stats?.total_draws ?? 0}
          icon={BarChart3}
          color="blue"
        />
        <StatCard
          title="Pending Verifications"
          value={stats?.pending_verifications ?? 0}
          icon={AlertCircle}
          color="amber"
        />
      </div>

      {/* Recent Winners */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h2 className="font-semibold text-white">Recent Winners</h2>
        </div>
        {recentWinners.length === 0 ? (
          <p className="text-slate-500 text-sm">No winners yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {recentWinners.map((winner) => {
              const profile = winner.profile as { full_name?: string } | undefined
              const draw = winner.draw as { name?: string } | undefined
              return (
                <div key={winner.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {profile?.full_name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {draw ? `${draw.name} — ${getMatchLabel(winner.match_type)}` : getMatchLabel(winner.match_type)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">
                      {formatPounds(winner.prize_amount)}
                    </p>
                    <Badge status={winner.status}>{winner.status}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
