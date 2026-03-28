import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getActiveSubscriptionIdForUser,
  getGolfScoresForUser,
} from '@/lib/supabase/user-scoped-queries'
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

    const { data, error } = await getGolfScoresForUser(user.id, 5)
    if (error) {
      console.error('GET /api/scores query:', error)
      return serverError()
    }
    return ok({ scores: data ?? [] })
  } catch (e) {
    console.error('GET /api/scores:', e)
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const { data: sub, error: subError } = await getActiveSubscriptionIdForUser(user.id)
    if (subError) {
      console.error('POST /api/scores subscription check:', subError)
      return serverError()
    }
    if (!sub) return badRequest('An active subscription is required to submit scores')

    const body = await request.json()
    const parsed = scoreSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('golf_scores')
      .insert({ ...parsed.data, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('POST /api/scores insert:', error)
      return serverError()
    }
    return created({ score: data })
  } catch (e) {
    console.error('POST /api/scores:', e)
    return serverError()
  }
}
