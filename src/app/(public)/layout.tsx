import { Navbar } from '@/components/layout/navbar'
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    // Always pass an object if user is logged in
    profile = data || { id: user.id, email: user.email, full_name: user.email?.split('@')[0] }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} GolfCharity. All rights reserved.</p>
      </footer>
    </div>
  )
}
