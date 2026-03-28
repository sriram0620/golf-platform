import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Heart, Trophy, Target, Users, Sparkles, CheckCircle2 } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

async function getFeaturedCharities() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('charities')
    .select('id,name,short_description,logo_url,total_received')
    .eq('is_featured', true)
    .eq('is_active', true)
    .limit(3)
  return data ?? []
}

export default async function HomePage() {
  const featuredCharities = await getFeaturedCharities()

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            Monthly prize draws · Charity giving · Golf scores
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
            Play golf.{' '}
            <span className="gradient-text">Win prizes.</span>
            <br />
            Change lives.
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Subscribe, enter your Stableford scores, and enter our monthly draw — while supporting a charity close to your heart with every payment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2 px-8">
                Start playing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                View pricing
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Monthly draws</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Charity contributions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Three simple steps to play, win, and give back.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: Target,
                title: 'Enter your scores',
                description: 'Log your latest Stableford golf scores. We keep your rolling 5-score history automatically.',
                color: 'emerald',
              },
              {
                step: '02',
                icon: Trophy,
                title: 'Join the monthly draw',
                description: 'Every subscriber is automatically entered into our monthly prize draw. Win from 3, 4, or 5 number matches.',
                color: 'blue',
              },
              {
                step: '03',
                icon: Heart,
                title: 'Support charity',
                description: 'A minimum 10% of your subscription goes to a charity you choose. Increase it any time.',
                color: 'purple',
              },
            ].map(({ step, icon: Icon, title, description, color }) => (
              <div key={step} className="glass rounded-2xl p-6 group hover:border-white/10 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${
                    color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                    color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-purple-500/10 text-purple-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-4xl font-black text-white/5">{step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Pool */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-3xl p-8 sm:p-12 glow-emerald">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
                  <Trophy className="h-3.5 w-3.5" />
                  Monthly Prize Pool
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Win real prizes every month
                </h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  60% of every subscription contributes directly to the prize pool. The more members, the bigger the prizes — with jackpot rollovers if no 5-match winner.
                </p>
                <Link href="/pricing">
                  <Button size="lg">Join now</Button>
                </Link>
              </div>

              <div className="space-y-4">
                {[
                  { label: '5-Number Match', share: '40%', note: 'Jackpot (rolls over)', color: 'amber' },
                  { label: '4-Number Match', share: '35%', note: 'Split among winners', color: 'emerald' },
                  { label: '3-Number Match', share: '25%', note: 'Split among winners', color: 'blue' },
                ].map(({ label, share, note, color }) => (
                  <div key={label} className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
                    <div className={`text-2xl font-black ${
                      color === 'amber' ? 'text-amber-400' :
                      color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'
                    }`}>{share}</div>
                    <div>
                      <p className="font-semibold text-white text-sm">{label}</p>
                      <p className="text-xs text-slate-500">{note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Charities */}
      {featuredCharities.length > 0 && (
        <section className="py-24 px-4 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Make an impact</h2>
                <p className="text-slate-400">Choose a cause you believe in.</p>
              </div>
              <Link href="/charities" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                All charities <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredCharities.map((charity) => (
                <Link key={charity.id} href={`/charities/${charity.id}`}>
                  <div className="glass rounded-2xl p-6 hover:border-white/10 transition-all group h-full">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                      <Heart className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                      {charity.name}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">
                      {charity.short_description}
                    </p>
                    <p className="text-xs text-emerald-500 font-medium">
                      £{charity.total_received.toLocaleString()} raised
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Social Proof */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { value: '£40K+', label: 'Donated to charity', icon: Heart },
              { value: '1,200+', label: 'Active members', icon: Users },
              { value: '£180K+', label: 'Prizes awarded', icon: Trophy },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="glass rounded-2xl py-8 px-6">
                <Icon className="h-6 w-6 text-emerald-400 mx-auto mb-3" />
                <p className="text-4xl font-black text-white mb-1">{value}</p>
                <p className="text-slate-400 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to make every round count?
          </h2>
          <p className="text-slate-400 mb-8">
            Join thousands of golfers already playing, winning, and giving back.
          </p>
          <Link href="/signup">
            <Button size="lg" className="px-10">
              Get started — from £19.99/mo
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
