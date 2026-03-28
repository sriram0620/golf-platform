import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-helpers'
import { ok, badRequest, forbidden, notFound, serverError } from '@/lib/api-response'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['pending', 'verified', 'rejected', 'paid']),
  admin_notes: z.string().optional(),
})

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
    const updates: Record<string, unknown> = { ...parsed.data }

    if (parsed.data.status === 'verified') {
      updates.verified_at = new Date().toISOString()
    }
    if (parsed.data.status === 'paid') {
      updates.paid_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('winners')
      .update(updates)
      .eq('id', id)
      .select('*, profile:profiles(id,full_name,email)')
      .single()

    if (error) throw error
    if (!data) return notFound('Winner not found')

    // Notify winner of status change
    if (parsed.data.status === 'verified' || parsed.data.status === 'rejected') {
      const messages: Record<string, string> = {
        verified: 'Your winning proof has been verified. Your payout is being processed.',
        rejected: `Your proof submission was rejected. ${parsed.data.admin_notes ? 'Reason: ' + parsed.data.admin_notes : 'Please contact support.'}`,
      }
      await supabase.from('notifications').insert({
        user_id: data.user_id,
        title: `Verification ${parsed.data.status}`,
        message: messages[parsed.data.status],
        type: parsed.data.status === 'verified' ? 'success' : 'error',
      })

      if (parsed.data.status === 'verified' && data.profile?.email) {
        const { sendEmail, emailTemplates } = await import('@/lib/email')
        const { formatPounds } = await import('@/lib/utils')
        const template = emailTemplates.winnerVerified(
          data.profile.full_name || 'Golfer',
          formatPounds(data.prize_amount)
        )
        await sendEmail({
          to: data.profile.email,
          subject: template.subject,
          html: template.html,
        })
      }
    }

    return ok({ winner: data })
  } catch {
    return serverError()
  }
}
