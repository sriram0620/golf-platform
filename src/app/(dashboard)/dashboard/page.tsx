import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { formatPounds, formatDate, formatMonthYear, getMatchLabel } from '@/lib/utils'
import {
  Target, Heart, Trophy, CreditCard,
  ArrowRight, AlertCircle, CheckCircle2, Plus
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [
    { data: subscription },
    { data: scores },
    { data: winners },
    { data: notifications },
  ] = await Promise.all([
    admin.from('subscriptions').select('*, charity:charities(id,name,slug)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
    admin.from('golf_scores').select('*').eq('user_id', user.id).order('played_date', { ascending: false }).limit(5),
    admin.from('winners').select('*, draw:draws(name,draw_month,draw_year)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    admin.from('notifications').select('*').eq('user_id', user.id).eq('is_read', false).order('created_at', { ascending: false }).limit(5),
  ])

  const totalWon = (winners ?? []).reduce((sum, w) => sum + w.prize_amount, 0)
  const isActive = subscription?.status === 'active'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Your golf charity overview</p>
        </div>
        {isActive && (
          <Link href="/dashboard/scores">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add score
            </Button>
          </Link>
        )}
      </div>

      {/* Subscription alert */}
      {!isActive && (
        <div className="glass rounded-2xl p-6 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-white mb-1">No active subscription</p>
              <p className="text-sm text-slate-400 mb-3">Subscribe to enter draws, track scores, and support charity.</p>
              <Link href="/pricing">
                <Button size="sm">Subscribe now</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="glass rounded-xl p-4 flex items-start gap-3 border border-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">{n.title}</p>
                <p className="text-xs text-slate-400">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Subscription"
          value={isActive ? 'Active' : 'Inactive'}
          icon={CreditCard}
          color={isActive ? 'emerald' : 'amber'}
          trend={subscription?.current_period_end ? `Renews ${formatDate(subscription.current_period_end)}` : undefined}
        />
        <StatCard
          title="Scores logged"
          value={scores?.length ?? 0}
          icon={Target}
          color="blue"
          trend="Rolling 5-score limit"
        />
        <StatCard
          title="Total won"
          value={formatPounds(totalWon)}
          icon={Trophy}
          color="amber"
        />
        <StatCard
          title="Charity"
          value={subscription?.charity?.name ?? '—'}
          icon={Heart}
          color="purple"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Scores */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Scores</h2>
            <Link href="/dashboard/scores" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {scores && scores.length > 0 ? (
            <div className="space-y-2">
              {scores.map((score) => (
                <div key={score.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div>
                    <span className="text-2xl font-black text-emerald-400">{score.score}</span>
                    <span className="text-xs text-slate-500 ml-1">pts</span>
                  </div>
                  <span className="text-sm text-slate-400">{formatDate(score.played_date)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Target className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No scores yet</p>
              {isActive && (
                <Link href="/dashboard/scores">
                  <Button size="sm" className="mt-3">Add your first score</Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Winnings */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Winnings</h2>
            <Link href="/dashboard/winnings" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {winners && winners.length > 0 ? (
            <div className="space-y-3">
              {winners.map((winner) => (
                <div key={winner.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {winner.draw ? formatMonthYear(winner.draw.draw_month, winner.draw.draw_year) : 'Draw'}
                    </p>
                    <p className="text-xs text-slate-500">{getMatchLabel(winner.match_type)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-400">{formatPounds(winner.prize_amount)}</p>
                    <Badge status={winner.status}>{winner.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Trophy className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No winnings yet — keep playing!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
