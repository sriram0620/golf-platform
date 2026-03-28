'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Trophy, ChevronDown, LogOut, LayoutDashboard, Settings, Shield } from 'lucide-react'
import type { Profile } from '@/types'

interface NavbarProps {
  profile?: Profile | null
}

export function Navbar({ profile: profileFromServer }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(profileFromServer ?? null)
  /** False until we know from server prop or /api/auth/me whether the user is a guest. */
  const [authReady, setAuthReady] = useState(!!profileFromServer)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const next = profileFromServer ?? null
    setProfile(next)
    setAuthReady(!!profileFromServer)
  }, [profileFromServer])

  useEffect(() => {
    if (authReady) return
    let cancelled = false
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return
        if (res.ok) {
          const json = await res.json()
          if (json.data?.profile) setProfile(json.data.profile)
        }
        setAuthReady(true)
      })
      .catch(() => {
        if (!cancelled) setAuthReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [authReady])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setProfile(null)
    setAuthReady(true)
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/charities', label: 'Charities' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/draws', label: 'Draws' },
  ]

  return (
    <nav className="sticky top-0 z-40 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <Trophy className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              Golf<span className="text-emerald-400">Charity</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-white bg-white/8'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {!authReady ? (
              <div className="flex items-center gap-3">
                <div className="h-9 w-20 rounded-lg bg-white/[0.06] animate-pulse" aria-hidden />
                <div className="h-9 w-24 rounded-lg bg-white/[0.06] animate-pulse" aria-hidden />
              </div>
            ) : profile ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-400">
                      {profile.full_name?.charAt(0).toUpperCase() ?? 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-slate-300">{profile.full_name?.split(' ')[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl py-1 shadow-xl border border-white/5 z-50">
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      {profile.role === 'admin' && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-white/5 transition-colors">
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <hr className="border-white/5 my-1" />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors cursor-pointer">
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400 cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="block px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5"
                onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}
            {!authReady ? (
              <div className="space-y-2 pt-2">
                <div className="h-10 rounded-lg bg-white/[0.06] animate-pulse" aria-hidden />
                <div className="h-10 rounded-lg bg-white/[0.06] animate-pulse" aria-hidden />
              </div>
            ) : profile ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                {profile.role === 'admin' && <Link href="/admin" className="block px-3 py-2.5 rounded-lg text-sm text-purple-400 hover:bg-white/5" onClick={() => setMobileOpen(false)}>Admin Panel</Link>}
                <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-white/5 cursor-pointer">Log out</button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Log in</Button></Link>
                <Link href="/signup" className="flex-1"><Button size="sm" className="w-full">Get started</Button></Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
