import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle2, Trophy, Heart, Target, Zap } from 'lucide-react'
import { SubscribeButton } from '@/components/public/subscribe-button'

const features = [
  'Monthly draw entries',
  'Score tracking (rolling 5)',
  'Charity contribution',
  'Winner verification portal',
  'Draw results & history',
  'Mobile-friendly dashboard',
]

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Simple, transparent pricing</h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          One subscription, all the features. Choose monthly or save with yearly.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Monthly */}
        <div className="glass rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1">Monthly</h2>
            <p className="text-slate-500 text-sm">Flexible, cancel anytime</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              ✦ 45 DAYS FREE TRIAL
            </div>
          </div>
          <div className="mb-8">
            <span className="text-5xl font-black text-white">£19.99</span>
            <span className="text-slate-400 ml-2">/month</span>
          </div>
          <SubscribeButton 
            plan="monthly" 
            isLoggedIn={isLoggedIn}
            className="w-full mb-6 border border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300 hover:text-white"
          >
            Get started
          </SubscribeButton>
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Yearly */}
        <div className="relative glass rounded-2xl p-8 border border-emerald-500/30 glow-emerald">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-4 py-1 rounded-full bg-emerald-500 text-black text-xs font-bold">
              BEST VALUE
            </span>
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1">Yearly</h2>
            <p className="text-emerald-400 text-sm font-medium">Save £39.99 per year</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              ✦ 45 DAYS FREE TRIAL
            </div>
          </div>
          <div className="mb-8">
            <span className="text-5xl font-black text-white">£199.88</span>
            <span className="text-slate-400 ml-2">/year</span>
            <p className="text-sm text-slate-500 mt-1">£16.66 per month billed annually</p>
          </div>
          <SubscribeButton 
            plan="yearly" 
            isLoggedIn={isLoggedIn}
            className="w-full mb-6 bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)]"
          >
            Get started
          </SubscribeButton>
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                {f}
              </li>
            ))}
            <li className="flex items-center gap-2.5 text-sm text-emerald-400 font-medium">
              <Zap className="h-4 w-4 shrink-0" />
              2 months free vs monthly
            </li>
          </ul>
        </div>
      </div>

      {/* What's included */}
      <div className="mt-20 grid sm:grid-cols-3 gap-6">
        {[
          { icon: Trophy, title: 'Monthly Draws', desc: 'Match 3, 4, or 5 numbers to win your share of the prize pool.' },
          { icon: Heart, title: 'Charity Giving', desc: 'Minimum 10% of your subscription goes to your chosen charity. Increase any time.' },
          { icon: Target, title: 'Score Tracking', desc: 'Enter your Stableford scores. We keep your rolling 5-score history automatically.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass rounded-2xl p-6 text-center">
            <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 mb-4">
              <Icon className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-slate-500 text-sm mt-12">
        Powered by Stripe. Secure, PCI-compliant payments. Cancel anytime from your dashboard.
      </p>
    </div>
  )
}
