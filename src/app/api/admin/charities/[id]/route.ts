import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-helpers'
import { ok, noContent, badRequest, forbidden, notFound, serverError } from '@/lib/api-response'

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
      .from('charities')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) return badRequest(error.message)
    if (!data) return notFound('Charity not found')
    return ok({ charity: data })
  } catch {
    return serverError()
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminProfile = await requireAdmin().catch(() => null)
    if (!adminProfile) return forbidden()

    const { id } = await params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('charities')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
    return noContent()
  } catch {
    return serverError()
  }
}
