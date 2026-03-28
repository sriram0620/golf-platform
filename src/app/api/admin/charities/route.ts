import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-helpers'
import { ok, created, badRequest, forbidden, serverError } from '@/lib/api-response'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  short_description: z.string().max(200).optional(),
  logo_url: z.string().url().optional(),
  cover_image_url: z.string().url().optional(),
  website_url: z.string().url().optional(),
  category: z.string().optional(),
  is_featured: z.boolean().default(false),
})

export async function GET() {
  try {
    const adminProfile = await requireAdmin().catch(() => null)
    if (!adminProfile) return forbidden()

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('charities')
      .select('*, events:charity_events(*)')
      .order('name')

    if (error) throw error
    return ok({ charities: data })
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
    const { data, error } = await supabase
      .from('charities')
      .insert(parsed.data)
      .select()
      .single()

    if (error) return badRequest(error.message)
    return created({ charity: data })
  } catch {
    return serverError()
  }
}
