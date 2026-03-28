import { createClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError } from '@/lib/api-response'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const { data, error } = await supabase
      .from('winners')
      .select('*, draw:draws(id,name,draw_month,draw_year)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return ok({ winners: data })
  } catch {
    return serverError()
  }
}
