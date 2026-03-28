import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: 'emerald' | 'blue' | 'purple' | 'none'
}

export function Card({ className, glow = 'none', children, ...props }: CardProps) {
  const glows = {
    emerald: 'glow-emerald',
    blue: 'glow-blue',
    purple: 'shadow-[0_0_60px_rgba(139,92,246,0.12)]',
    none: '',
  }

  return (
    <div
      className={cn('glass rounded-2xl p-6', glows[glow], className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-white', className)} {...props}>
      {children}
    </h3>
  )
}
