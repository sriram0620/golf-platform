import { createAdminClient } from '@/lib/supabase/admin'
import { formatMonthYear, formatPounds } from '@/lib/utils'
import { Trophy, Hash, Users } from 'lucide-react'

export const revalidate = 300

async function getPublishedDraws() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('draw_year', { ascending: false })
    .order('draw_month', { ascending: false })
    .limit(24)
  return data ?? []
}

export default async function PublicDrawsPage() {
  const draws = await getPublishedDraws()

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Draw Results</h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          View past monthly draw results, winning numbers, and prize pool breakdowns.
        </p>
      </div>

      {draws.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">No draws yet</h3>
          <p className="text-slate-400 text-sm">
            Draws are run monthly. Check back soon for results!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {draws.map((draw) => (
            <div key={draw.id} className="glass rounded-2xl p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{draw.name}</h2>
                  <p className="text-slate-400 text-sm">
                    {formatMonthYear(draw.draw_month, draw.draw_year)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="h-4 w-4" />
                  {draw.participant_count} participants
                </div>
              </div>

              {/* Drawn numbers */}
              {draw.drawn_numbers?.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Hash className="h-3 w-3" /> Winning numbers
                  </p>
                  <div className="flex gap-3">
                    {draw.drawn_numbers.map((n: number, i: number) => (
                      <div
                        key={i}
                        className="h-12 w-12 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-lg font-black text-emerald-400"
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prize pools */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-amber-500/5 rounded-xl py-4 border border-amber-500/10">
                  <p className="text-xl font-black text-amber-400">{formatPounds(draw.five_match_pool)}</p>
                  <p className="text-xs text-slate-500 mt-1">5-Number Match</p>
                  <p className="text-xs text-amber-400/60">Jackpot</p>
                </div>
                <div className="bg-emerald-500/5 rounded-xl py-4 border border-emerald-500/10">
                  <p className="text-xl font-black text-emerald-400">{formatPounds(draw.four_match_pool)}</p>
                  <p className="text-xs text-slate-500 mt-1">4-Number Match</p>
                </div>
                <div className="bg-blue-500/5 rounded-xl py-4 border border-blue-500/10">
                  <p className="text-xl font-black text-blue-400">{formatPounds(draw.three_match_pool)}</p>
                  <p className="text-xs text-slate-500 mt-1">3-Number Match</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-xs text-slate-500">
                <span>Total pool: {formatPounds(draw.total_pool)}</span>
                {draw.jackpot_rollover > 0 && (
                  <span className="text-amber-400">
                    Includes {formatPounds(draw.jackpot_rollover)} jackpot rollover
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
