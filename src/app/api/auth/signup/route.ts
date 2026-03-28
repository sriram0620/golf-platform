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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    })

    if (error) return badRequest(error.message)
    return ok({ user: data.user })
  } catch {
    return serverError()
  }
}
