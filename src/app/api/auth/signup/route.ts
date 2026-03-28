import { createClient } from '@/lib/supabase/server'
import { ok, badRequest, serverError } from '@/lib/api-response'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2).max(100),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const { email, password, full_name } = parsed.data
    const supabase = await createClient()

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    })

    if (error) return badRequest(error.message)
    if (!authData.user) return badRequest('Failed to create user')

    // Explicitly create profile to prevent missing row constraint errors later
    // The DB trigger might fail without proper privileges, so we ensure it here.
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    await admin.from('profiles').upsert({
      id: authData.user.id,
      email: email,
      full_name: full_name,
      role: 'subscriber'
    }, { onConflict: 'id' }).select()

    return ok({ user: authData.user })
  } catch (err) {
    console.error('Signup error:', err)
    return serverError()
  }
}
