import { createAdminClient } from '@/lib/supabase/admin'
import { CharityList } from '@/components/public/charity-list'

export const revalidate = 60

async function getCharities() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name')
  return data ?? []
}

export default async function CharitiesPage() {
  const charities = await getCharities()

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Charity Directory</h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Choose a cause you believe in. A minimum 10% of your subscription goes directly to your selected charity, making a real impact every single month.
        </p>
      </div>

      <CharityList initialCharities={charities} />
    </div>
  )
}
