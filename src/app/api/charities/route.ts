import { createAdminClient } from '@/lib/supabase/admin'
import { ok, serverError } from '@/lib/api-response'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')

    const supabase = createAdminClient()
    let query = supabase
      .from('charities')
      .select('*, events:charity_events(*)')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name')

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (category) query = query.eq('category', category)
    if (featured === 'true') query = query.eq('is_featured', true)

    const { data, error } = await query
    if (error) throw error
    return ok({ charities: data })
  } catch {
    return serverError()
  }
}
