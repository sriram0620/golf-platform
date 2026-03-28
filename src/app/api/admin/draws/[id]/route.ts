import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-helpers'
import { ok, badRequest, forbidden, notFound, serverError } from '@/lib/api-response'
import { generateDrawNumbers, runDrawSimulation } from '@/lib/draw-engine'
import { z } from 'zod'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminProfile = await requireAdmin().catch(() => null)
    if (!adminProfile) return forbidden()

    const { id } = await params
    const supabase = createAdminClient()

    const { data: draw, error } = await supabase
      .from('draws')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !draw) return notFound('Draw not found')

    const { data: entries } = await supabase
      .from('draw_entries')
      .select('*, profile:profiles(id,full_name,email)')
      .eq('draw_id', id)

    const { data: winners } = await supabase
      .from('winners')
      .select('*, profile:profiles(id,full_name,email)')
      .eq('draw_id', id)

    return ok({ draw, entries: entries ?? [], winners: winners ?? [] })
  } catch {
    return serverError()
  }
}

const simulateSchema = z.object({ draw_type: z.enum(['random', 'algorithmic']).optional() })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminProfile = await requireAdmin().catch(() => null)
    if (!adminProfile) return forbidden()

    const { id } = await params
    const body = await request.json()
    const { action } = body

    const supabase = createAdminClient()
    const { data: draw } = await supabase
      .from('draws')
      .select('*')
      .eq('id', id)
      .single()

    if (!draw) return notFound('Draw not found')

    if (action === 'simulate') {
      const parsed = simulateSchema.safeParse(body)
      if (!parsed.success) return badRequest(parsed.error.issues[0].message)

      const { data: entries } = await supabase
        .from('draw_entries')
        .select('*, profile:profiles(id,full_name)')
        .eq('draw_id', id)

      const drawType = parsed.data.draw_type ?? draw.draw_type
      const drawnNumbers = generateDrawNumbers(drawType, entries ?? [])
      const simulation = runDrawSimulation(
        entries ?? [],
        drawnNumbers,
        draw.total_pool,
        draw.jackpot_rollover
      )

      await supabase
        .from('draws')
        .update({ status: 'simulation', drawn_numbers: drawnNumbers, simulation_data: simulation, draw_type: drawType })
        .eq('id', id)

      return ok({ simulation, drawn_numbers: drawnNumbers })
    }

    if (action === 'publish') {
      if (draw.status === 'published') return badRequest('Draw already published')
      if (!draw.drawn_numbers?.length) return badRequest('Run simulation first')

      const { data: entries } = await supabase
        .from('draw_entries')
        .select('*, profile:profiles(id,full_name)')
        .eq('draw_id', id)

      const simulation = runDrawSimulation(
        entries ?? [],
        draw.drawn_numbers,
        draw.total_pool,
        draw.jackpot_rollover
      )

      // Create winner records
      for (const winner of simulation.winners) {
        await supabase.from('winners').insert({
          draw_id: id,
          user_id: winner.user_id,
          match_type: winner.match_type,
          matched_numbers: winner.matched_numbers,
          prize_amount: winner.prize_amount,
        })
      }

      // If no 5-match winner, rollover jackpot
      const jackpotRollover = simulation.five_match_count === 0 ? draw.five_match_pool : 0

      await supabase
        .from('draws')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          five_match_pool: simulation.five_match_count === 0 ? jackpotRollover : draw.five_match_pool,
        })
        .eq('id', id)

      // Notify winners
      for (const winner of simulation.winners) {
        await supabase.from('notifications').insert({
          user_id: winner.user_id,
          title: `You won in the ${draw.name} draw!`,
          message: `Congratulations! You matched ${winner.match_type.replace('_', ' ')} and won £${winner.prize_amount.toFixed(2)}. Please submit your verification proof.`,
          type: 'winner',
          metadata: { draw_id: id, prize_amount: winner.prize_amount },
        })
        
        const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', winner.user_id).single()
        if (profile?.email) {
          const { sendEmail, emailTemplates } = await import('@/lib/email')
          const { formatMonthYear } = await import('@/lib/utils')
          const template = emailTemplates.drawPublished(
            profile.full_name || 'Golfer',
            draw.name,
            formatMonthYear(draw.draw_month, draw.draw_year)
          )
          await sendEmail({
            to: profile.email,
            subject: template.subject,
            html: template.html,
          })
        }
      }

      return ok({ message: 'Draw published', winners_count: simulation.winners.length })
    }

    return badRequest('Unknown action')
  } catch (err) {
    console.error(err)
    return serverError()
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminProfile = await requireAdmin().catch(() => null)
    if (!adminProfile) return forbidden()

    const { id } = await params
    const body = await request.json()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('draws')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return ok({ draw: data })
  } catch {
    return serverError()
  }
}
