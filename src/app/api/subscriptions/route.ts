import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, PLAN_PRICES } from '@/lib/stripe'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api-response'
import { z } from 'zod'

const createSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  charity_id: z.string().uuid().optional(),
  charity_percentage: z.number().min(10).max(100).optional().default(10),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const { data } = await supabase
      .from('subscriptions')
      .select('*, charity:charities(id,name,slug,logo_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return ok({ subscription: data })
  } catch {
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
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const { plan, charity_id, charity_percentage } = parsed.data
    const priceConfig = PLAN_PRICES[plan]
    const admin = createAdminClient()

    // Check for existing active subscription
    const { data: existing } = await admin
      .from('subscriptions')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (existing) return badRequest('You already have an active subscription')

    // Get or create Stripe customer
    let customerId: string
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    const existingSub = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .maybeSingle()

    if (existingSub?.data?.stripe_customer_id) {
      customerId = existingSub.data.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email!,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceConfig.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=cancelled`,
      metadata: {
        user_id: user.id,
        plan,
        charity_id: charity_id ?? '',
        charity_percentage: String(charity_percentage),
      },
    })

    return ok({ url: session.url })
  } catch (err) {
    console.error('Subscription creation error:', err)
    return serverError()
  }
}
