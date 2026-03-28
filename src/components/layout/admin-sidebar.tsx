'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Trophy, Heart, Award, BarChart3, ChevronRight, Shield } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/draws', label: 'Draws', icon: Trophy },
  { href: '/admin/charities', label: 'Charities', icon: Heart },
  { href: '/admin/winners', label: 'Winners', icon: Award },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      <div className="sticky top-20">
        <div className="flex items-center gap-2 px-3 py-2 mb-4">
          <Shield className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Admin Panel</span>
        </div>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  active
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300')} />
                {label}
                {active && <ChevronRight className="h-3 w-3 ml-auto text-purple-400/50" />}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
