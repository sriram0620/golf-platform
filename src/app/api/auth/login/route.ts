import { createClient } from '@/lib/supabase/server'
import { ok, badRequest, serverError } from '@/lib/api-response'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
    if (error) return badRequest(error.message)

    return ok({ user: data.user })
  } catch {
    return serverError()
  }
}
