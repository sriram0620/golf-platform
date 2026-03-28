import { createClient } from '@/lib/supabase/server'
import { ok, noContent, badRequest, unauthorized, notFound, serverError } from '@/lib/api-response'
import { z } from 'zod'

const updateSchema = z.object({
  score: z.number().int().min(1).max(45).optional(),
  played_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const { data, error } = await supabase
      .from('golf_scores')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return notFound('Score not found')
    return ok({ score: data })
  } catch {
    return serverError()
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const { id } = await params
    const { error } = await supabase
      .from('golf_scores')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return noContent()
  } catch {
    return serverError()
  }
}
