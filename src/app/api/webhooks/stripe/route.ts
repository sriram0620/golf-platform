import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any

      // Handle independent donations
      if (session.mode === 'payment' && session.metadata?.type === 'independent_donation') {
        const { charity_id, user_id } = session.metadata
        const amount = (session.amount_total ?? 0) / 100

        await supabase.from('charity_contributions').insert({
          user_id,
          charity_id,
          amount,
          percentage: 100,
          contribution_date: new Date().toISOString().split('T')[0],
        })
        break
      }

      // Handle subscription checkouts
      const { user_id, plan, charity_id, charity_percentage } = session.metadata ?? {}
      if (!user_id || !plan) break

      const stripeSubscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      ) as any

      await supabase.from('subscriptions').upsert({
        user_id,
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: session.customer as string,
        plan: plan as 'monthly' | 'yearly',
        status: 'active',
        amount: (stripeSubscription.items.data[0].price.unit_amount ?? 0) / 100,
        charity_id: charity_id || null,
        charity_percentage: parseFloat(charity_percentage ?? '10'),
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      }, { onConflict: 'stripe_subscription_id' })

      // Auto-enrol in upcoming draw
      const now = new Date()
      const { data: upcomingDraw } = await supabase
        .from('draws')
        .select('id')
        .eq('draw_month', now.getMonth() + 1)
        .eq('draw_year', now.getFullYear())
        .neq('status', 'published')
        .single()

      if (upcomingDraw) {
        const { data: scores } = await supabase
          .from('golf_scores')
          .select('score')
          .eq('user_id', user_id)
          .order('played_date', { ascending: false })
          .limit(5)

        if (scores && scores.length > 0) {
          await supabase.from('draw_entries').upsert({
            draw_id: upcomingDraw.id,
            user_id,
            score_snapshot: scores.map((s) => s.score),
          }, { onConflict: 'draw_id,user_id' })
        }
      }

      // Welcome notification
      await supabase.from('notifications').insert({
        user_id,
        title: 'Subscription activated!',
        message: `Welcome to Golf Charity! Your ${plan} subscription is now active. Start entering your scores to participate in the next draw.`,
        type: 'success',
      })
      
      // Send Welcome Email
      const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', user_id).single()
      if (profile?.email) {
        const { sendEmail, emailTemplates } = await import('@/lib/email')
        const template = emailTemplates.welcome(profile.full_name || 'Golfer', plan as string)
        await sendEmail({
          to: profile.email,
          subject: template.subject,
          html: template.html,
        })
      }
      
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as any
      const statusMap: Record<string, string> = {
        active: 'active',
        past_due: 'past_due',
        canceled: 'cancelled',
        trialing: 'trialing',
      }

      await supabase
        .from('subscriptions')
        .update({
          status: statusMap[sub.status] ?? 'inactive',
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as any
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as any
      if (!invoice.subscription) break

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, user_id, amount, charity_id, charity_percentage')
        .eq('stripe_subscription_id', invoice.subscription as string)
        .single()

      if (!subscription) break

      // Record charity contribution
      if (subscription.charity_id) {
        await supabase.from('charity_contributions').insert({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          charity_id: subscription.charity_id,
          amount: subscription.amount * (subscription.charity_percentage / 100),
          percentage: subscription.charity_percentage,
          contribution_date: new Date().toISOString().split('T')[0],
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
