import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-helpers'
import { ok, created, badRequest, forbidden, serverError } from '@/lib/api-response'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(3),
  draw_month: z.number().int().min(1).max(12),
  draw_year: z.number().int().min(2024),
  draw_type: z.enum(['random', 'algorithmic']).default('random'),
})

export async function GET() {
  try {
    const adminProfile = await requireAdmin().catch(() => null)
    if (!adminProfile) return forbidden()

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('draws')
      .select('*')
      .order('draw_year', { ascending: false })
      .order('draw_month', { ascending: false })

    if (error) throw error
    return ok({ draws: data })
  } catch {
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const adminProfile = await requireAdmin().catch(() => null)
    if (!adminProfile) return forbidden()

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const supabase = createAdminClient()

    // Calculate prize pool from paying / trialing subscribers
    const { count: activeSubscribers } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact' })
      .in('status', ['active', 'trialing'])

    const monthlyEquivalent = 19.99
    const totalPool = (activeSubscribers ?? 0) * monthlyEquivalent * 0.6

    // Check for existing jackpot rollover
    const { data: lastDraw } = await supabase
      .from('draws')
      .select('jackpot_pool, five_match_pool')
      .eq('status', 'published')
      .order('draw_year', { ascending: false })
      .order('draw_month', { ascending: false })
      .limit(1)
      .single()

    const jackpotRollover = lastDraw?.five_match_pool ?? 0

    const fiveMatchPool = totalPool * 0.4 + jackpotRollover
    const fourMatchPool = totalPool * 0.35
    const threeMatchPool = totalPool * 0.25

    const { data, error } = await supabase
      .from('draws')
      .insert({
        ...parsed.data,
        total_pool: totalPool,
        jackpot_pool: fiveMatchPool,
        jackpot_rollover: jackpotRollover,
        five_match_pool: fiveMatchPool,
        four_match_pool: fourMatchPool,
        three_match_pool: threeMatchPool,
        participant_count: activeSubscribers ?? 0,
        created_by: adminProfile.id,
      })
      .select()
      .single()

    if (error) throw error
    return created({ draw: data })
  } catch {
    return serverError()
  }
}
