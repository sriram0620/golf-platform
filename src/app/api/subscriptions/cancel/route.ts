import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { ok, badRequest, unauthorized, notFound, serverError } from '@/lib/api-response'
import { SUBSCRIPTION_ACCESS_STATUSES } from '@/lib/subscription-access'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const admin = createAdminClient()
    const { data: subscription, error: findError } = await admin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', [...SUBSCRIPTION_ACCESS_STATUSES])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (findError) {
      console.error('POST /api/subscriptions/cancel find:', findError)
      return serverError()
    }
    if (!subscription) return notFound('No active subscription')

    if (subscription.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        })
      } catch (e) {
        console.error('Stripe cancel_at_period_end:', e)
        return badRequest('Unable to update billing. Try again or contact support.')
      }
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
