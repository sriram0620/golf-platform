import { createAdminClient } from '@/lib/supabase/admin'
import { ok, serverError } from '@/lib/api-response'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('draws')
      .select('*')
      .eq('status', 'published')
      .order('draw_year', { ascending: false })
      .order('draw_month', { ascending: false })

    if (error) throw error
    return ok({ draws: data })
  } catch {
    return serverError()
  }
}
