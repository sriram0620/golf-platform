'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Target, Heart, Trophy, CreditCard,
  Settings, Bell, ChevronRight
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/scores', label: 'My Scores', icon: Target },
  { href: '/dashboard/charity', label: 'Charity', icon: Heart },
  { href: '/dashboard/draws', label: 'Draws', icon: Trophy },
  { href: '/dashboard/winnings', label: 'Winnings', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      <nav className="space-y-1 sticky top-20">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300')} />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto text-emerald-400/50" />}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
