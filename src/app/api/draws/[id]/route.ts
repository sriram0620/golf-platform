import { createAdminClient } from '@/lib/supabase/admin'
import { ok, notFound, serverError } from '@/lib/api-response'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: draw, error } = await supabase
      .from('draws')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single()

    if (error || !draw) return notFound('Draw not found')

    const { data: winners } = await supabase
      .from('winners')
      .select('*, profile:profiles(id, full_name)')
      .eq('draw_id', id)
      .order('prize_amount', { ascending: false })

    return ok({ draw, winners: winners ?? [] })
  } catch {
    return serverError()
  }
}
