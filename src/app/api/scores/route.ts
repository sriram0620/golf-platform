import { createClient } from '@/lib/supabase/server'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/api-response'
import { z } from 'zod'

const scoreSchema = z.object({
  score: z.number().int().min(1).max(45),
  played_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional(),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const { data, error } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_date', { ascending: false })
      .limit(5)

    if (error) throw error
    return ok({ scores: data })
  } catch {
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    // Require active subscription to submit scores
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!sub) return badRequest('An active subscription is required to submit scores')

    const body = await request.json()
    const parsed = scoreSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    // Trigger will auto-remove oldest if count >= 5
    const { data, error } = await supabase
      .from('golf_scores')
      .insert({ ...parsed.data, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    return created({ score: data })
  } catch {
    return serverError()
  }
}
