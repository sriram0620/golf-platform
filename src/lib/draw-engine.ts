import type { DrawEntry, MatchType, DrawSimulationResult, DrawType } from '@/types'
import { PRIZE_POOL_DISTRIBUTION } from '@/types'

// Draw 5 unique numbers from user score pool (1-45)
export function generateDrawNumbers(
  type: DrawType,
  entries: DrawEntry[]
): number[] {
  if (type === 'algorithmic' && entries.length > 0) {
    return algorithmicDraw(entries)
  }
  return randomDraw()
}

function randomDraw(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1)
  const drawn: number[] = []
  while (drawn.length < 5) {
    const idx = Math.floor(Math.random() * pool.length)
    drawn.push(pool.splice(idx, 1)[0])
  }
  return drawn.sort((a, b) => a - b)
}

function algorithmicDraw(entries: DrawEntry[]): number[] {
  // Build frequency map of all scores submitted
  const freq = new Map<number, number>()
  for (const entry of entries) {
    for (const score of entry.score_snapshot) {
      freq.set(score, (freq.get(score) || 0) + 1)
    }
  }

  // Weight: less frequent scores are harder to match — draw the least frequent
  const allNumbers = Array.from({ length: 45 }, (_, i) => i + 1)
  const weights = allNumbers.map((n) => 1 / ((freq.get(n) || 0) + 1))
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  const drawn: number[] = []
  const available = [...allNumbers]

  while (drawn.length < 5 && available.length > 0) {
    let rand = Math.random() * totalWeight
    let cumulative = 0
    for (let i = 0; i < available.length; i++) {
      cumulative += weights[available[i] - 1]
      if (rand <= cumulative) {
        drawn.push(available.splice(i, 1)[0])
        break
      }
    }
  }

  return drawn.sort((a, b) => a - b)
}

export function matchNumbers(userNumbers: number[], drawnNumbers: number[]): number[] {
  return userNumbers.filter((n) => drawnNumbers.includes(n))
}

export function getMatchType(matchCount: number): MatchType | null {
  if (matchCount >= 5) return 'five_match'
  if (matchCount === 4) return 'four_match'
  if (matchCount === 3) return 'three_match'
  return null
}

export function calculatePrizePools(totalPool: number, jackpotRollover: number) {
  const fiveMatchPool = totalPool * PRIZE_POOL_DISTRIBUTION.five_match + jackpotRollover
  const fourMatchPool = totalPool * PRIZE_POOL_DISTRIBUTION.four_match
  const threeMatchPool = totalPool * PRIZE_POOL_DISTRIBUTION.three_match
  return { fiveMatchPool, fourMatchPool, threeMatchPool }
}

export function runDrawSimulation(
  entries: DrawEntry[],
  drawnNumbers: number[],
  totalPool: number,
  jackpotRollover: number
): DrawSimulationResult {
  const { fiveMatchPool, fourMatchPool, threeMatchPool } = calculatePrizePools(totalPool, jackpotRollover)

  const fiveWinners: DrawEntry[] = []
  const fourWinners: DrawEntry[] = []
  const threeWinners: DrawEntry[] = []

  for (const entry of entries) {
    const matched = matchNumbers(entry.score_snapshot, drawnNumbers)
    const matchType = getMatchType(matched.length)
    if (matchType === 'five_match') fiveWinners.push(entry)
    else if (matchType === 'four_match') fourWinners.push(entry)
    else if (matchType === 'three_match') threeWinners.push(entry)
  }

  const buildWinners = (
    winnerEntries: DrawEntry[],
    matchType: MatchType,
    pool: number
  ) =>
    winnerEntries.map((e) => ({
      user_id: e.user_id,
      full_name: (e as DrawEntry & { profile?: { full_name?: string } }).profile?.full_name ?? 'Unknown',
      match_type: matchType,
      matched_numbers: matchNumbers(e.score_snapshot, drawnNumbers),
      prize_amount: winnerEntries.length > 0 ? pool / winnerEntries.length : 0,
    }))

  return {
    drawn_numbers: drawnNumbers,
    winners: [
      ...buildWinners(fiveWinners, 'five_match', fiveMatchPool),
      ...buildWinners(fourWinners, 'four_match', fourMatchPool),
      ...buildWinners(threeWinners, 'three_match', threeMatchPool),
    ],
    five_match_count: fiveWinners.length,
    four_match_count: fourWinners.length,
    three_match_count: threeWinners.length,
    total_pool: totalPool,
  }
}
