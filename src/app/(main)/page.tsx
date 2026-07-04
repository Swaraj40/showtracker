export const dynamic = "force-dynamic"

import { getTrendingShows } from '@/lib/tmdb'
import { ShowCard } from '@/components/ShowCard'

export default async function Home() {
  const trending = await getTrendingShows()
  
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Trending Shows</h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {trending.map((show) => (
          <ShowCard key={show.id} show={show} />
        ))}
      </div>
    </div>
  )
}
