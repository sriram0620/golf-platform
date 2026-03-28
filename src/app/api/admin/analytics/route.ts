import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-helpers'
import { ok, forbidden, serverError } from '@/lib/api-response'

export async function GET() {
  try {
    const adminProfile = await requireAdmin().catch(() => null)
    if (!adminProfile) return forbidden()

    const supabase = createAdminClient()

    const [
      { count: totalUsers },
      { count: activeSubscribers },
      { data: prizePoolData },
      { data: charityData },
      { count: totalDraws },
      { count: pendingVerifications },
      { data: recentWinners },
      { data: monthlySignups },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('draws').select('total_pool').eq('status', 'published'),
      supabase.from('charity_contributions').select('amount'),
      supabase.from('draws').select('id', { count: 'exact', head: true }),
      supabase.from('winners').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('winners')
        .select('*, profile:profiles(full_name), draw:draws(name,draw_month,draw_year)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('profiles')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(100),
    ])

    const totalPrizePool = prizePoolData?.reduce((sum, d) => sum + (d.total_pool ?? 0), 0) ?? 0
    const totalCharityContributions = charityData?.reduce((sum, d) => sum + (d.amount ?? 0), 0) ?? 0

    return ok({
      stats: {
        total_users: totalUsers ?? 0,
        active_subscribers: activeSubscribers ?? 0,
        total_prize_pool: totalPrizePool,
        total_charity_contributions: totalCharityContributions,
        total_draws: totalDraws ?? 0,
        pending_verifications: pendingVerifications ?? 0,
      },
      recent_winners: recentWinners ?? [],
      monthly_signups: monthlySignups ?? [],
    })
  } catch {
    return serverError()
  }
}
