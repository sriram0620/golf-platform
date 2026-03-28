import { createClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError } from '@/lib/api-response'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return unauthorized()

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return ok({ profile })
  } catch {
    return serverError()
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const { full_name, phone, country } = body

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name, phone, country })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return ok({ profile: data })
  } catch {
    return serverError()
  }
}
