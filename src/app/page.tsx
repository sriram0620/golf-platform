import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, Trophy, Target, ArrowRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPounds } from '@/lib/utils'

export const revalidate = 60

async function getHomePageData() {
  const supabase = createAdminClient()
  const [
    { data: charities },
    { data: stats },
  ] = await Promise.all([
    supabase.from('charities').select('*').eq('is_active', true).eq('is_featured', true).limit(3),
    supabase.rpc('get_admin_stats')
  ])
  
  return {
    featuredCharities: charities ?? [],
    stats: stats?.[0] ?? { total_prize_pool: 0, total_charity_contributions: 0 }
  }
}
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'

export default async function HomePage() {
  const { featuredCharities, stats } = await getHomePageData()
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data || { id: user.id, email: user.email, full_name: user.email?.split('@')[0] }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar profile={profile} />
      {/* Hero Section */}
      <section className="relative px-4 pt-32 pb-20 sm:pt-40 sm:pb-24 lg:pb-32 overflow-hidden flex-1 flex flex-col justify-center">
        {/* Abstract background blobs */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-8 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
            <Heart className="h-4 w-4" />
            <span>Over {formatPounds(Math.max(stats.total_charity_contributions, 1000))} raised for charity</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
            Play for a cause. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 drop-shadow-sm">
              Win for yourself.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-300 leading-relaxed">
            The subscription platform where your monthly golf scores enter you into massive prize draws, while supporting the charities you care about most.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] transition-all">
                Start your subscription <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/charities" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base bg-white/5 hover:bg-white/10 border-white/10 backdrop-blur-md">
                Explore charities
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-black/40 border-y border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Three simple steps to make an impact and join the prize pool.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-8 text-9xl font-black text-white/[0.03] select-none pointer-events-none group-hover:text-emerald-500/[0.05] transition-colors">1</div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                <Target className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Log your scores</h3>
              <p className="text-slate-400 leading-relaxed">
                Subscribe and enter your last 5 Stableford scores. The system maintains a rolling record of your performance.
              </p>
            </div>

            <div className="glass rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-8 text-9xl font-black text-white/[0.03] select-none pointer-events-none group-hover:text-emerald-500/[0.05] transition-colors">2</div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center mb-6">
                <Heart className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Support charity</h3>
              <p className="text-slate-400 leading-relaxed">
                A minimum of 10% of your subscription goes directly to your chosen charity, making a real-world impact every month.
              </p>
            </div>

            <div className="glass rounded-3xl p-8 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-8 text-9xl font-black text-white/[0.03] select-none pointer-events-none group-hover:text-amber-500/[0.05] transition-colors">3</div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6">
                <Trophy className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Win the draw</h3>
              <p className="text-slate-400 leading-relaxed">
                Your scores power your entry into the monthly draw. Match drawn numbers to win shares of the guaranteed prize pool.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Charities Section */}
      {featuredCharities.length > 0 && (
        <section className="py-24 px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Make an impact</h2>
                <p className="text-slate-400 text-lg max-w-xl">Support amazing causes. Here are just a few of the charities you can choose to back with your subscription.</p>
              </div>
              <Link href="/charities">
                <Button variant="outline" className="hidden sm:flex bg-transparent border-white/10 hover:bg-white/5">
                  View all charities <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredCharities.map((charity) => (
                <Link key={charity.id} href={`/charities/${charity.slug}`}>
                  <div className="glass rounded-3xl p-8 h-full hover:border-white/15 transition-all group flex flex-col justify-between cursor-pointer">
                    <div>
                      <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform shadow-lg">
                        <Heart className="h-6 w-6 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                        {charity.name}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">
                        {charity.short_description || charity.description}
                      </p>
                    </div>
                    <div className="flex items-center text-sm text-emerald-500 font-medium">
                      Learn more →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <Link href="/charities" className="mt-8 flex justify-center sm:hidden">
              <Button variant="outline" className="w-full bg-transparent border-white/10 hover:bg-white/5">
                View all charities
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
