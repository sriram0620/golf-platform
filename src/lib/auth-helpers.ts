import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SUBSCRIPTION_ACCESS_STATUSES } from '@/lib/subscription-access'
import type { Profile } from '@/types'

export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getAuthProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

export async function requireAuth() {
  const user = await getAuthUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export async function requireAdmin() {
  const profile = await getAuthProfile()
  if (!profile || profile.role !== 'admin') throw new Error('FORBIDDEN')
  return profile
}

export async function getActiveSubscription(userId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('*, charity:charities(*)')
    .eq('user_id', userId)
    .in('status', [...SUBSCRIPTION_ACCESS_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}
