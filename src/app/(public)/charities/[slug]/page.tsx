import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { formatPounds, formatDate } from '@/lib/utils'
import { Heart, Calendar, MapPin, ExternalLink, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DonateButton } from '@/components/public/donate-button'

export const revalidate = 60

async function getCharity(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('charities')
    .select('*, events:charity_events(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
}

export default async function CharityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const charity = await getCharity(slug)
  if (!charity) notFound()

  const upcomingEvents = (charity.events ?? [])
    .filter((e: { event_date: string }) => new Date(e.event_date) >= new Date())
    .sort((a: { event_date: string }, b: { event_date: string }) =>
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    )

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link href="/charities" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to charities
      </Link>

      <div className="glass rounded-2xl overflow-hidden mb-8">
        <div className="h-48 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 flex items-center justify-center">
          <Heart className="h-16 w-16 text-emerald-400/30" />
        </div>
        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              {charity.category && (
                <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full mb-2 inline-block">
                  {charity.category}
                </span>
              )}
              <h1 className="text-3xl font-bold text-white">{charity.name}</h1>
            </div>
            <div className="glass rounded-xl p-4 text-center shrink-0">
              <p className="text-2xl font-black text-emerald-400">{formatPounds(charity.total_received)}</p>
              <p className="text-xs text-slate-500">Total raised</p>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed mb-6">{charity.description}</p>

          <div className="flex gap-3">
            <Link href="/signup">
              <Button>Support via Monthly Subscription</Button>
            </Link>
            {charity.website_url && (
              <a href={charity.website_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  Visit website <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
          </div>
          
          <DonateButton charityId={charity.id} charityName={charity.name} />
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            {upcomingEvents.map((event: { id: string; title: string; description?: string; event_date: string; location?: string }) => (
              <div key={event.id} className="glass rounded-xl p-5">
                <h3 className="font-semibold text-white mb-2">{event.title}</h3>
                {event.description && <p className="text-sm text-slate-400 mb-3">{event.description}</p>}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(event.event_date)}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
