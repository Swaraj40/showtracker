export const dynamic = "force-dynamic"

import { getTrendingShows } from '@/lib/tmdb'
import { ShowCard } from '@/components/ShowCard'

export default async function Home() {
  const trending = await getTrendingShows()
  
  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-2xl font-bold px-2">Discover</h1>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {trending.map((show) => (
          <ShowCard key={show.id} show={show} />
        ))}
      </div>
    </div>
  )
}
