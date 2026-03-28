'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface SubscribeButtonProps {
  plan: 'monthly' | 'yearly'
  isLoggedIn: boolean
  className?: string
  children: React.ReactNode
}

export function SubscribeButton({ plan, isLoggedIn, className, children }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      router.push(`/signup?plan=${plan}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || 'Failed to subscribe')
        setLoading(false)
        return
      }

      if (json.data?.alreadySubscribed) {
        toast.success('You already have an active subscription. Redirecting to your dashboard.')
      } else {
        toast.success('Subscription activated! Enjoy your 45-Day Trial.')
      }
      const nextUrl = json.data?.url || '/dashboard?subscription=success'
      router.push(nextUrl)
      router.refresh()
    } catch (err) {
      toast.error('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleSubscribe} 
      loading={loading} 
      className={className}
    >
      {children}
    </Button>
  )
}
