import { getUpcomingMovies, TMDBMovie } from '@/lib/tmdb'
import { ShowCard } from '@/components/ShowCard' // We can reuse ShowCard for movies if we pass correct props

export const dynamic = "force-dynamic"

export default async function MoviesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const p = await searchParams;
  const tab = p.tab || 'watchlist'

  // Fetch upcoming movies grouped by date
  let upcoming: TMDBMovie[] = []
  if (tab === 'upcoming') {
    upcoming = await getUpcomingMovies()
  }

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Nav Tabs */}
      <div className="flex items-center w-full border-b border-[#1E1E1E]">
        <a 
          href="/movies?tab=watchlist" 
          className={`flex-1 text-center py-4 text-xs font-bold tracking-widest ${tab === 'watchlist' ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}
        >
          WATCH LIST
        </a>
        <a 
          href="/movies?tab=upcoming" 
          className={`flex-1 text-center py-4 text-xs font-bold tracking-widest ${tab === 'upcoming' ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}
        >
          UPCOMING
        </a>
      </div>

      <div className="flex justify-end p-4">
        {/* Mock icon for grid view toggle */}
        <button className="text-[#FFD54F]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        </button>
      </div>

      {tab === 'watchlist' ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4 text-center">
          <p className="text-gray-400">Your Movie Watchlist is empty.</p>
          <a href="/movies?tab=upcoming" className="bg-[#FFD54F] text-black px-6 py-2 rounded-full font-bold mt-4">
            Find Movies
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-2">
          {/* Group by date mock, TMDB doesn't sort strictly by date in a grouped way, so we just show them in a grid for now with a mock date pill */}
          <div className="flex items-center justify-center">
            <span className="bg-[#1E1E1E] text-gray-300 text-xs font-bold px-4 py-1 rounded-full">
              UPCOMING THIS MONTH
            </span>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {upcoming.map((movie) => (
              <div key={movie.id} className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : '/placeholder.jpg'} 
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
