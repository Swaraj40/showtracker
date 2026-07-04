import { searchShows, searchMovies } from '@/lib/tmdb'
import { QuickTrackButton } from '@/components/QuickTrackButton'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SearchIcon } from 'lucide-react'

export const dynamic = "force-dynamic"

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const p = await searchParams;
  const query = p.q || ''
  
  let showResults: any[] = []
  let movieResults: any[] = []

  if (query.length > 2) {
    [showResults, movieResults] = await Promise.all([
      searchShows(query),
      searchMovies(query)
    ])
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const trackedShows = new Set<number>()
  if (user) {
    const { data: userShows } = await supabase
      .from('user_shows')
      .select('show_id')
      .eq('user_id', user.id)
    
    if (userShows) {
      userShows.forEach(s => trackedShows.add(s.show_id))
    }
  }

  return (
    <div className="flex flex-col w-full pb-16 pt-4 px-4">
      <h1 className="text-2xl font-bold mb-4">Search</h1>
      
      <form action="/search" method="GET" className="relative mb-6">
        <input 
          type="text" 
          name="q" 
          defaultValue={query}
          placeholder="Search for shows or movies..." 
          className="w-full bg-[#1E1E1E] text-white rounded-full py-3 px-12 outline-none focus:ring-2 focus:ring-[#FFD54F]"
        />
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      </form>

      {query.length > 2 ? (
        <div className="flex flex-col gap-6">
          {showResults.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-gray-400 uppercase tracking-widest">Shows</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {showResults.slice(0, 10).map((show) => {
                  const isTracked = trackedShows.has(show.id)
                  return (
                    <div key={show.id} className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-900 group block">
                      <a href={`/show/${show.id}`} className="absolute inset-0 z-10" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={show.poster_path ? `https://image.tmdb.org/t/p/w342${show.poster_path}` : '/placeholder.jpg'} 
                        alt={show.name}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2 pb-8">
                        <span className="text-xs font-bold line-clamp-2">{show.name}</span>
                      </div>
                      <div className="absolute z-20 top-2 right-2">
                         {user && <QuickTrackButton showId={show.id} isTracked={isTracked} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {movieResults.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-gray-400 uppercase tracking-widest">Movies</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {movieResults.slice(0, 10).map((movie) => {
                  return (
                    <div key={movie.id} className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-900 block">
                      {/* Note: Movie details page not yet implemented */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : '/placeholder.jpg'} 
                        alt={movie.title}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2 pb-8">
                        <span className="text-xs font-bold line-clamp-2">{movie.title}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {showResults.length === 0 && movieResults.length === 0 && (
            <div className="text-center text-gray-500 py-12">No results found for "{query}"</div>
          )}
        </div>
      ) : (
        query.length > 0 && query.length <= 2 ? (
          <div className="text-center text-gray-500 py-12">Type at least 3 characters to search</div>
        ) : (
          <div className="text-center text-gray-500 py-12">Enter a show or movie name to begin</div>
        )
      )}
    </div>
  )
}
