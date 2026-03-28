import { createClient } from '@/lib/supabase/server'
import { ok, badRequest, unauthorized, notFound, serverError } from '@/lib/api-response'
import { z } from 'zod'

const schema = z.object({
  proof_url: z.string().url(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const { id } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const { data: winner } = await supabase
      .from('winners')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!winner) return notFound('Winner record not found')
    if (winner.status !== 'pending') return badRequest('Proof already submitted')

    const { data, error } = await supabase
      .from('winners')
      .update({
        proof_url: parsed.data.proof_url,
        proof_submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return ok({ winner: data })
  } catch {
    return serverError()
  }
}
