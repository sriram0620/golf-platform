import { createAdminClient } from '@/lib/supabase/admin'
import { ok, notFound, serverError } from '@/lib/api-response'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('charities')
      .select('*, events:charity_events(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !data) return notFound('Charity not found')
    return ok({ charity: data })
  } catch {
    return serverError()
  }
}
