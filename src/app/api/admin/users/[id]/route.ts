import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-helpers'
import { ok, badRequest, forbidden, notFound, serverError } from '@/lib/api-response'
import { z } from 'zod'

const updateSchema = z.object({
  full_name: z.string().min(2).optional(),
  role: z.enum(['subscriber', 'admin']).optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminProfile = await requireAdmin().catch(() => null)
    if (!adminProfile) return forbidden()

    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        subscription:subscriptions(*,charity:charities(id,name)),
        scores:golf_scores(* order(played_date.desc)),
        winnings:winners(*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return notFound('User not found')
    return ok({ user: data })
  } catch {
    return serverError()
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminProfile = await requireAdmin().catch(() => null)
    if (!adminProfile) return forbidden()

    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('profiles')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return notFound('User not found')
    return ok({ user: data })
  } catch {
    return serverError()
  }
}
