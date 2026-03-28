'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Heart, Search, ExternalLink } from 'lucide-react'
import { formatPounds } from '@/lib/utils'

interface Charity {
  id: string
  name: string
  slug: string
  category: string | null
  short_description: string | null
  description: string
  is_featured: boolean
  total_received: number
}

export function CharityList({ initialCharities }: { initialCharities: Charity[] }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = useMemo(() => {
    const cats = [...new Set(initialCharities.map((c) => c.category).filter(Boolean))] as string[]
    return ['all', ...cats]
  }, [initialCharities])

  const filteredCharities = useMemo(() => {
    return initialCharities.filter((charity) => {
      const matchesSearch = charity.name.toLowerCase().includes(search.toLowerCase()) || 
        (charity.description?.toLowerCase() || '').includes(search.toLowerCase())
      
      const matchesCategory = activeCategory === 'all' || charity.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [initialCharities, search, activeCategory])

  return (
    <div>
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search charities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          />
        </div>
        
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 items-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                  activeCategory === cat
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {filteredCharities.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Heart className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No charities found matching your search.</p>
          <button 
            onClick={() => { setSearch(''); setActiveCategory('all'); }}
            className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharities.map((charity) => (
            <Link key={charity.id} href={`/charities/${charity.slug}`}>
              <div className="glass rounded-2xl p-6 h-full hover:border-white/10 transition-all group flex flex-col justify-between cursor-pointer">
                <div>
                  {charity.is_featured && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
                      ✦ Featured
                    </div>
                  )}

                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                      <Heart className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-lg">
                        {charity.name}
                      </h3>
                      {charity.category && (
                        <span className="text-xs text-slate-500">{charity.category}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-3">
                    {charity.short_description ?? charity.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                  <span className="text-sm text-emerald-500 font-medium">
                    {formatPounds(charity.total_received)} raised
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-white transition-colors">
                    Profile <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
