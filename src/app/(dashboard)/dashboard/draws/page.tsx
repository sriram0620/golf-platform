import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatMonthYear, formatPounds, getMatchLabel } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Trophy, Hash } from 'lucide-react'

export const revalidate = 300

export default async function DrawsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [{ data: draws }, { data: myEntries }, { data: scores }] = await Promise.all([
    admin.from('draws').select('*').eq('status', 'published').order('draw_year', { ascending: false }).order('draw_month', { ascending: false }).limit(12),
    admin.from('draw_entries').select('draw_id').eq('user_id', user.id),
    admin.from('golf_scores').select('score').eq('user_id', user.id).order('played_date', { ascending: false }).limit(5),
  ])

  const enteredDrawIds = new Set((myEntries ?? []).map((e) => e.draw_id))
  const myNumbers = (scores ?? []).map((s) => s.score)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Draws</h1>
        <p className="text-slate-400 text-sm mt-0.5">Monthly prize draw history</p>
      </div>

      {/* My numbers */}
      {myNumbers.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="h-5 w-5 text-emerald-400" />
            <h2 className="font-semibold text-white">Your draw numbers</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {myNumbers.map((n, i) => (
              <div key={i} className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                {n}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Based on your latest {myNumbers.length} Stableford score{myNumbers.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Draws list */}
      {!draws?.length ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">No draws yet</h3>
          <p className="text-slate-400 text-sm">Draws are run monthly. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {draws.map((draw) => {
            const entered = enteredDrawIds.has(draw.id)
            return (
              <div key={draw.id} className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-white">{draw.name}</h3>
                    <p className="text-sm text-slate-400">{formatMonthYear(draw.draw_month, draw.draw_year)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entered && <Badge status="active">Entered</Badge>}
                    <Badge status={draw.status}>{draw.status}</Badge>
                  </div>
                </div>

                {draw.drawn_numbers?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">Drawn numbers:</p>
                    <div className="flex gap-2">
                      {draw.drawn_numbers.map((n: number, i: number) => {
                        const matched = myNumbers.includes(n)
                        return (
                          <div key={i} className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border ${
                            matched
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : 'bg-white/5 border-white/10 text-slate-400'
                          }`}>
                            {n}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-amber-500/5 rounded-xl py-3 border border-amber-500/10">
                    <p className="text-lg font-black text-amber-400">{formatPounds(draw.five_match_pool)}</p>
                    <p className="text-xs text-slate-500">5-Match Jackpot</p>
                  </div>
                  <div className="bg-emerald-500/5 rounded-xl py-3 border border-emerald-500/10">
                    <p className="text-lg font-black text-emerald-400">{formatPounds(draw.four_match_pool)}</p>
                    <p className="text-xs text-slate-500">4-Match Pool</p>
                  </div>
                  <div className="bg-blue-500/5 rounded-xl py-3 border border-blue-500/10">
                    <p className="text-lg font-black text-blue-400">{formatPounds(draw.three_match_pool)}</p>
                    <p className="text-xs text-slate-500">3-Match Pool</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs text-slate-500">
                  <span>{draw.participant_count} participants</span>
                  <span>Total pool: {formatPounds(draw.total_pool)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
