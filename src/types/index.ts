export type UserRole = 'subscriber' | 'admin'
export type SubscriptionPlan = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
export type DrawStatus = 'draft' | 'simulation' | 'published'
export type DrawType = 'random' | 'algorithmic'
export type MatchType = 'five_match' | 'four_match' | 'three_match'
export type WinnerStatus = 'pending' | 'verified' | 'rejected' | 'paid'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  phone: string | null
  country: string
  created_at: string
  updated_at: string
}

export interface Charity {
  id: string
  name: string
  slug: string
  description: string
  short_description: string | null
  logo_url: string | null
  cover_image_url: string | null
  website_url: string | null
  category: string | null
  is_featured: boolean
  is_active: boolean
  total_received: number
  created_at: string
  updated_at: string
  events?: CharityEvent[]
}

export interface CharityEvent {
  id: string
  charity_id: string
  title: string
  description: string | null
  event_date: string
  location: string | null
  image_url: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  amount: number
  charity_id: string | null
  charity_percentage: number
  current_period_start: string | null
  current_period_end: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  charity?: Charity
  profile?: Profile
}

export interface GolfScore {
  id: string
  user_id: string
  score: number
  played_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Draw {
  id: string
  name: string
  draw_month: number
  draw_year: number
  draw_type: DrawType
  status: DrawStatus
  drawn_numbers: number[]
  total_pool: number
  jackpot_pool: number
  jackpot_rollover: number
  five_match_pool: number
  four_match_pool: number
  three_match_pool: number
  participant_count: number
  simulation_data: Record<string, unknown> | null
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  score_snapshot: number[]
  created_at: string
  profile?: Profile
}

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  entry_id: string | null
  match_type: MatchType
  matched_numbers: number[]
  prize_amount: number
  status: WinnerStatus
  proof_url: string | null
  proof_submitted_at: string | null
  admin_notes: string | null
  verified_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  profile?: Profile
  draw?: Draw
}

export interface CharityContribution {
  id: string
  user_id: string
  subscription_id: string | null
  charity_id: string
  amount: number
  percentage: number
  contribution_date: string
  created_at: string
  charity?: Charity
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AdminStats {
  total_users: number
  active_subscribers: number
  total_prize_pool: number
  total_charity_contributions: number
  total_draws: number
  pending_verifications: number
}

export interface DrawSimulationResult {
  drawn_numbers: number[]
  winners: Array<{
    user_id: string
    full_name: string
    match_type: MatchType
    matched_numbers: number[]
    prize_amount: number
  }>
  five_match_count: number
  four_match_count: number
  three_match_count: number
  total_pool: number
}

export const SUBSCRIPTION_PRICES = {
  monthly: { amount: 1999, display: '£19.99', label: 'per month' },
  yearly: { amount: 19988, display: '£199.88', label: 'per year', savings: 'Save £39.99' },
} as const

export const PRIZE_POOL_DISTRIBUTION = {
  five_match: 0.4,
  four_match: 0.35,
  three_match: 0.25,
} as const

export const PRIZE_POOL_CONTRIBUTION_RATE = 0.6 // 60% of subscription goes to prize pool
export const MIN_CHARITY_PERCENTAGE = 10
export const MAX_SCORE = 45
export const MIN_SCORE = 1
export const MAX_SCORES_PER_USER = 5
