import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getAccessibleSubscriptionForUser,
  getLatestSubscriptionForUser,
} from '@/lib/supabase/user-scoped-queries'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api-response'
import { SUBSCRIPTION_ACCESS_STATUSES } from '@/lib/subscription-access'
import { z } from 'zod'

const createSchema = z.object({
  plan: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
    z.enum(['monthly', 'yearly'], { message: 'plan must be monthly or yearly' })
  ),
  charity_id: z.string().uuid().optional(),
  charity_percentage: z.coerce.number().min(10).max(100).optional().default(10),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const { data: accessible, error } = await getAccessibleSubscriptionForUser(user.id)

    if (error) {
      console.error('GET /api/subscriptions:', error)
      return serverError()
    }

    if (accessible) return ok({ subscription: accessible })

    const { data: latest, error: latestError } = await getLatestSubscriptionForUser(user.id)
    if (latestError) {
      console.error('GET /api/subscriptions (latest):', latestError)
      return serverError()
    }

    return ok({ subscription: latest })
  } catch (e) {
    console.error('GET /api/subscriptions:', e)
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('; ')
      return badRequest(msg)
    }

    const { plan, charity_id, charity_percentage } = parsed.data
    const admin = createAdminClient()

    // Check for existing active subscription
    const { data: existing } = await admin
      .from('subscriptions')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .in('status', [...SUBSCRIPTION_ACCESS_STATUSES])
      .maybeSingle()

    if (existing) {
      const base = process.env.NEXT_PUBLIC_APP_URL || ''
      return ok({
        url: `${base}/dashboard?subscription=success`,
        alreadySubscribed: true,
      })
    }

    // Directly activate the 45-day free trial in the database
    // This perfectly bypasses the need for Stripe keys/webhooks during the trial
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 45)

    // Insert active subscription
    const amount = plan === 'monthly' ? 19.99 : 199.88
    
    const { error: insertError } = await admin.from('subscriptions').insert({
      user_id: user.id,
      plan,
      status: 'active',
      amount,
      charity_percentage: charity_percentage,
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndDate.toISOString(),
      // Use charity_id if provided, otherwise the DB leaves it null until they select one
      ...(charity_id ? { charity_id } : {})
    })

    if (insertError) {
      console.error('Trial insert error:', insertError)
      return serverError()
    }

    // Send Welcome Email directly
    const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', user.id).single()
    if (profile?.email) {
      const { sendEmail, emailTemplates } = await import('@/lib/email')
      const template = emailTemplates.welcome(profile.full_name || 'Golfer', plan as string)
      // Non-blocking fire and forget
      sendEmail({
        to: profile.email,
        subject: template.subject,
        html: template.html,
      }).catch(console.error)
    }

    return ok({ url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success` })
  } catch (err) {
    console.error('Subscription creation error:', err)
    return serverError()
  }
}
