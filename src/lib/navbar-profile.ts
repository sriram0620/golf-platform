import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

/** Navbar always needs a row shape when `user` exists so we never show “Log in” for a logged-in session. */
export function navbarProfileFromAuthUser(
  user: User,
  row: Profile | null
): Profile {
  if (row) return row
  const meta = user.user_metadata as { full_name?: string } | undefined
  const fromMeta = meta?.full_name?.trim()
  const fallbackName = user.email?.split('@')[0] ?? 'Member'
  return {
    id: user.id,
    email: user.email ?? '',
    full_name: fromMeta || fallbackName,
    avatar_url: null,
    role: 'subscriber',
    phone: null,
    country: 'GB',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
