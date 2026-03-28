import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { ok, badRequest, unauthorized, notFound, serverError } from '@/lib/api-response'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const admin = createAdminClient()
    const { data: subscription } = await admin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!subscription) return notFound('No active subscription')

    if (subscription.stripe_subscription_id) {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
    }

    const { data: updated, error } = await admin
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', subscription.id)
      .select()
      .single()

    if (error) return badRequest(error.message)
    return ok({ subscription: updated })
  } catch {
    return serverError()
  }
}
