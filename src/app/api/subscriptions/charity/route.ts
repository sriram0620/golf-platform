import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ok, badRequest, unauthorized, notFound, serverError } from '@/lib/api-response'
import { z } from 'zod'

const schema = z.object({
  charity_id: z.string().uuid(),
  charity_percentage: z.number().min(10).max(100),
})

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const admin = createAdminClient()
    const { data: subscription } = await admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!subscription) return notFound('No active subscription')

    const { data: updated, error } = await admin
      .from('subscriptions')
      .update(parsed.data)
      .eq('id', subscription.id)
      .select('*, charity:charities(*)')
      .single()

    if (error) return badRequest(error.message)
    return ok({ subscription: updated })
  } catch {
    return serverError()
  }
}
