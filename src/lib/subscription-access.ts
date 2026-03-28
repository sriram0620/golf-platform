/**
 * Statuses where the user should have subscriber features (draws, scores, charity prefs).
 * Matches Stripe: trialing users are full subscribers until trial ends.
 */
export const SUBSCRIPTION_ACCESS_STATUSES = ['active', 'trialing'] as const

export type SubscriptionAccessStatus = (typeof SUBSCRIPTION_ACCESS_STATUSES)[number]

export function hasSubscriptionAccess(
  status: string | null | undefined
): status is SubscriptionAccessStatus {
  return (
    status === 'active' ||
    status === 'trialing'
  )
}
