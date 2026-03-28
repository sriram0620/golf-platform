import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-helpers'
import { ok, forbidden, serverError } from '@/lib/api-response'

export async function GET(request: Request) {
  try {
    const profile = await requireAdmin().catch(() => null)
    if (!profile) return forbidden()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const offset = (page - 1) * limit

    const supabase = createAdminClient()
    let query = supabase
      .from('profiles')
      .select('*, subscription:subscriptions(id,plan,status,amount,current_period_end)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, count, error } = await query
    if (error) throw error
    return ok({ users: data, total: count, page, limit })
  } catch {
    return serverError()
  }
}
