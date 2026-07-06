import { getMovieDetails } from '@/lib/tmdb'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = "force-dynamic"

export default async function MoviesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const p = await searchParams;
  const tab = p.tab || 'watchlist'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let upcomingMovies: any[] = []
  let watchlistMovies: any[] = []

  if (!user) redirect('/login')

  const { data: userMovies } = await supabase
    .from('user_movies')
    .select('movie_id')
    .eq('user_id', user.id)
    .eq('status', 'watchlist')

  if (userMovies && userMovies.length > 0) {
    const allMovies = await Promise.all(
      userMovies.map(async (m) => {
        try {
          return await getMovieDetails(m.movie_id)
        } catch (e) {
          return null
        }
      })
    )
    
    const validMovies = allMovies.filter((m): m is NonNullable<typeof m> => m !== null)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    validMovies.forEach((movie) => {
      const releaseDate = movie.release_date ? new Date(movie.release_date) : new Date(0)
      if (releaseDate > today) {
        upcomingMovies.push(movie)
      } else {
        watchlistMovies.push(movie)
      }
    })
  }

  // If user requested watchlist tab, we already filtered it. Same for upcoming.
  const displayMovies = tab === 'upcoming' ? upcomingMovies : watchlistMovies

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Nav Tabs */}
      <div className="flex items-center w-full border-b border-border">
        <Link 
          href="/movies?tab=watchlist" 
          className={`flex-1 text-center py-4 text-xs font-bold tracking-widest ${tab === 'watchlist' ? 'text-foreground border-b-2 border-white' : 'text-foreground-muted'}`}
        >
          WATCH LIST
        </Link>
        <Link 
          href="/movies?tab=upcoming" 
          className={`flex-1 text-center py-4 text-xs font-bold tracking-widest ${tab === 'upcoming' ? 'text-foreground border-b-2 border-white' : 'text-foreground-muted'}`}
        >
          UPCOMING
        </Link>
      </div>

      <div className="flex justify-end p-4">
        {/* Mock icon for grid view toggle */}
        <button className="text-[#FFD54F]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        </button>
      </div>

      <div className="flex flex-col px-2">
        {displayMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4 text-center">
            <p className="text-foreground-muted">
              {tab === 'upcoming' ? "You have no upcoming movies in your watchlist." : "Your Movie Watchlist is empty."}
            </p>
            <Link href="/explore" className="bg-[#FFD54F] text-black px-6 py-2 rounded-full font-bold mt-4">
              Find Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {displayMovies.map((movie) => (
              <Link href={`/movies/${movie.id}`} key={movie.id} className="relative aspect-[2/3] rounded-md overflow-hidden bg-surface-elevated block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={movie.poster_path ? (movie.poster_path.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w342${movie.poster_path}`) : '/placeholder.jpg'} 
                  alt={movie.title}
                  className="w-full h-full object-cover opacity-90 transition-opacity hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                  <span className="text-xs font-bold line-clamp-2 text-foreground">{movie.title}</span>
                  {tab === 'upcoming' && movie.release_date && (
                    <span className="text-[10px] font-bold text-[#FFD54F]">{new Date(movie.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
