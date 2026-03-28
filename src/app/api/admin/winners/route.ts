import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-helpers'
import { ok, forbidden, serverError } from '@/lib/api-response'

export async function GET(request: Request) {
  try {
    const adminProfile = await requireAdmin().catch(() => null)
    if (!adminProfile) return forbidden()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const supabase = createAdminClient()
    let query = supabase
      .from('winners')
      .select('*, profile:profiles(id,full_name,email), draw:draws(id,name,draw_month,draw_year)')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return ok({ winners: data })
  } catch {
    return serverError()
  }
}
