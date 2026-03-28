import { createAdminClient } from '@/lib/supabase/admin'
import { SUBSCRIPTION_ACCESS_STATUSES } from '@/lib/subscription-access'

/**
 * After verifying the user with the user-scoped Supabase client, use these helpers
 * so reads/writes succeed even when Route Handler cookie → JWT → PostgREST/RLS is flaky.
 * Every query is strictly filtered by `userId` from `getUser()`.
 */
export function getAccessibleSubscriptionForUser(userId: string) {
  const admin = createAdminClient()
  return admin
    .from('subscriptions')
    .select('*, charity:charities(id,name,slug,logo_url)')
    .eq('user_id', userId)
    .in('status', [...SUBSCRIPTION_ACCESS_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}

export function getLatestSubscriptionForUser(userId: string) {
  const admin = createAdminClient()
  return admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}

export function getGolfScoresForUser(userId: string, limit = 5) {
  const admin = createAdminClient()
  return admin
    .from('golf_scores')
    .select('*')
    .eq('user_id', userId)
    .order('played_date', { ascending: false })
    .limit(limit)
}

export function getWinnersForUser(userId: string, limit = 3) {
  const admin = createAdminClient()
  return admin
    .from('winners')
    .select('*, draw:draws(name,draw_month,draw_year)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
}

export function getUnreadNotificationsForUser(userId: string, limit = 5) {
  const admin = createAdminClient()
  return admin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(limit)
}

export function getActiveSubscriptionIdForUser(userId: string) {
  const admin = createAdminClient()
  return admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .in('status', [...SUBSCRIPTION_ACCESS_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}
