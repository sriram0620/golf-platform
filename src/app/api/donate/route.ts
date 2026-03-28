import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api-response'
import { z } from 'zod'

const donateSchema = z.object({
  charity_id: z.string().uuid(),
  amount: z.number().int().min(500), // Min £5
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()
    
    const userId = user.id

    const body = await request.json()
    const parsed = donateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const { charity_id, amount } = parsed.data
    const admin = createAdminClient()

    // Verify charity exists
    const { data: charity } = await admin
      .from('charities')
      .select('id, name')
      .eq('id', charity_id)
      .eq('is_active', true)
      .single()

    if (!charity) return badRequest('Charity not found or inactive')

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Donation to ${charity.name}`,
              description: 'Independent charity donation via Golf Charity Platform',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/charities?donation=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/charities?donation=cancelled`,
      metadata: {
        type: 'independent_donation',
        charity_id,
        user_id: userId ?? 'anonymous',
      },
      customer_creation: 'always',
    })

    return ok({ url: session.url })
  } catch (err) {
    console.error('Donation checkout error:', err)
    return serverError()
  }
}
