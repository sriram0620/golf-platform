import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}

export function formatPounds(pounds: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pounds)
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM yyyy')
}

export function formatMonthYear(month: number, year: number): string {
  return format(new Date(year, month - 1), 'MMMM yyyy')
}

export function getMatchLabel(matchType: string): string {
  const labels: Record<string, string> = {
    five_match: '5-Number Match',
    four_match: '4-Number Match',
    three_match: '3-Number Match',
  }
  return labels[matchType] ?? matchType
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-emerald-400',
    inactive: 'text-slate-400',
    cancelled: 'text-red-400',
    past_due: 'text-amber-400',
    pending: 'text-amber-400',
    verified: 'text-emerald-400',
    rejected: 'text-red-400',
    paid: 'text-blue-400',
    published: 'text-emerald-400',
    draft: 'text-slate-400',
    simulation: 'text-purple-400',
  }
  return colors[status] ?? 'text-slate-400'
}

export function getStatusBadge(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    past_due: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    verified: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    paid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    simulation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }
  return colors[status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

export function calculatePrizePoolContribution(subscriptionAmount: number): number {
  return subscriptionAmount * 0.6
}

export function calculateCharityContribution(
  subscriptionAmount: number,
  charityPercentage: number
): number {
  return subscriptionAmount * (charityPercentage / 100)
}
