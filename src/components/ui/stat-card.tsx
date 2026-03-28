import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  color?: 'emerald' | 'blue' | 'purple' | 'amber'
  className?: string
}

export function StatCard({ title, value, icon: Icon, trend, color = 'emerald', className }: StatCardProps) {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    amber: 'bg-amber-500/10 text-amber-400',
  }

  return (
    <div className={cn('glass rounded-2xl p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && <p className="text-xs text-emerald-400 mt-1">{trend}</p>}
        </div>
        <div className={cn('p-2.5 rounded-xl', colors[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
