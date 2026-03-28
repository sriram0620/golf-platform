'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import toast from 'react-hot-toast'

interface DonateButtonProps {
  charityId: string
  charityName: string
}

export function DonateButton({ charityId, charityName }: DonateButtonProps) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState<number>(10)

  const handleDonate = async () => {
    if (amount < 5) {
      toast.error('Minimum donation is £5')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charity_id: charityId, amount: amount * 100 }), // Convert to pence
      })
      const json = await res.json()
      
      if (!res.ok) {
        toast.error(json.error)
        setLoading(false)
        return
      }

      // Redirect to Stripe checkout
      window.location.href = json.data.url
    } catch (err) {
      toast.error('Failed to initiate donation')
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 border border-emerald-500/20 bg-emerald-500/5 mt-8">
      <div className="flex items-center gap-3 mb-4">
        <Heart className="h-5 w-5 text-emerald-400" />
        <h3 className="font-semibold text-white">Make a direct donation</h3>
      </div>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        Want to support {charityName} outside of your regular subscription? Make a direct, one-off donation right now.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">£</span>
          <input
            type="number"
            min="5"
            step="1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-11 pl-8 pr-4 bg-black/40 border border-emerald-500/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
          />
        </div>
        <Button onClick={handleDonate} loading={loading} className="w-full sm:w-auto px-8 bg-emerald-500 hover:bg-emerald-400 text-black">
          Donate Now
        </Button>
      </div>
    </div>
  )
}
