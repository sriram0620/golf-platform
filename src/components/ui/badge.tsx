import { cn, getStatusBadge } from '@/lib/utils'

interface BadgeProps {
  status?: string
  children: React.ReactNode
  className?: string
}

export function Badge({ status, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        status ? getStatusBadge(status) : 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        className
      )}
    >
      {children}
    </span>
  )
}
