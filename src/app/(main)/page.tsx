export const dynamic = "force-dynamic"

import { getTrendingShows, getUpcomingMovies, getSimilarShows, getSimilarMovies, TMDBShow, TMDBMovie } from '@/lib/tmdb'
import { createClient } from '@/utils/supabase/server'
import { QuickTrackButton } from '@/components/QuickTrackButton'
import { Search } from 'lucide-react'

import { redirect } from 'next/navigation'

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/welcome')
  }

  // Tracked shows/movies to filter out
  const trackedShows = new Set<number>()
  const trackedMovies = new Set<number>()

  // Base Discovery
  let allShows: TMDBShow[] = await getTrendingShows()
  let allMovies: TMDBMovie[] = await getUpcomingMovies()

  if (user) {
    // Fetch User Shows
    const { data: userShows } = await supabase
      .from('user_shows')
      .select('show_id, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    
    if (userShows) {
      userShows.forEach(s => trackedShows.add(s.show_id))
      
      // Personalization: Fetch similar shows for the most recently interacted show
      if (userShows.length > 0) {
        try {
          const similar = await getSimilarShows(userShows[0].show_id)
          allShows = [...allShows, ...similar]
        } catch(e) {}
      }
    }

    // Fetch User Movies (if table exists)
    try {
      const { data: userMovies } = await supabase
        .from('user_movies')
        .select('movie_id, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (userMovies) {
        userMovies.forEach(m => trackedMovies.add(m.movie_id))
        
        if (userMovies.length > 0) {
          const similar = await getSimilarMovies(userMovies[0].movie_id)
          allMovies = [...allMovies, ...similar]
        }
      }
    } catch(e) {}
  }

  // Deduplicate and filter out already tracked content
  const uniqueShowsMap = new Map<number, TMDBShow>()
  allShows.forEach(show => {
    if (!trackedShows.has(show.id)) {
      uniqueShowsMap.set(show.id, show)
    }
  })

  const uniqueMoviesMap = new Map<number, TMDBMovie>()
  allMovies.forEach(movie => {
    if (!trackedMovies.has(movie.id)) {
      uniqueMoviesMap.set(movie.id, movie)
    }
  })

  // Convert to universal format
  type FeedItem = {
    id: number
    title: string
    type: 'tv' | 'movie'
    backdrop_path: string | null
    poster_path: string | null
    year: string
    rating: number
    isTracked: boolean
  }

  const feedItems: FeedItem[] = [
    ...Array.from(uniqueShowsMap.values()).map(show => ({
      id: show.id,
      title: show.name,
      type: 'tv' as const,
      backdrop_path: show.backdrop_path,
      poster_path: show.poster_path,
      year: new Date(show.first_air_date || Date.now()).getFullYear().toString(),
      rating: show.vote_average,
      isTracked: false // We already filtered out tracked ones, but we keep this flag just in case
    })),
    ...Array.from(uniqueMoviesMap.values()).map(movie => ({
      id: movie.id,
      title: movie.title,
      type: 'movie' as const,
      backdrop_path: movie.backdrop_path,
      poster_path: movie.poster_path,
      year: new Date(movie.release_date || Date.now()).getFullYear().toString(),
      rating: movie.vote_average,
      isTracked: false
    }))
  ]

  // Filter out items without backdrops to ensure a beautiful feed
  const richFeedItems = feedItems.filter(item => item.backdrop_path)

  // Shuffle for a fresh feed on every reload
  const finalFeed = shuffleArray(richFeedItems)
  
  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Nav */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <span className="font-bold text-sm text-foreground-muted cursor-pointer hover:text-foreground transition-colors">FEED</span>
          <span className="font-bold text-sm bg-[#FFD54F] text-black px-4 py-1.5 rounded-full shadow-lg">DISCOVER</span>
          <span className="font-bold text-sm text-foreground-muted cursor-pointer hover:text-foreground transition-colors">GROUPS</span>
          <span className="font-bold text-sm text-foreground-muted cursor-pointer hover:text-foreground transition-colors">ACTIVITY</span>
        </div>
        
        {/* Search Button */}
        <a href="/search" className="text-foreground-muted hover:text-foreground ml-4 shrink-0 p-2 hover:bg-surface-elevated rounded-full transition-colors">
          <Search size={22} />
        </a>
      </div>
      
      <div className="flex flex-col gap-1 mt-4 px-2">
        {finalFeed.slice(0, 20).map((item) => {
          const backdropUrl = item.backdrop_path?.startsWith('http') ? item.backdrop_path : `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
          
          return (
            <a key={`${item.type}-${item.id}`} href={`/${item.type === 'tv' ? 'show' : 'movies'}/${item.id}`} className="block relative w-full h-[240px] md:h-[300px] mb-4 bg-surface-elevated overflow-hidden rounded-xl group shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={backdropUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              
              {/* Add Button (only for TV for now, as QuickTrackButton is likely TV specific unless adapted) */}
              {user && item.type === 'tv' && (
                <QuickTrackButton showId={item.id} isTracked={item.isTracked} />
              )}

              <div className="absolute bottom-4 left-4 flex flex-col z-10 pr-16 text-white">
                <div className="flex items-center gap-2">
                  <span className="text-white text-xl font-bold tracking-wide drop-shadow-md">{item.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/80 font-semibold mt-1">
                  <span className={`px-2 py-0.5 rounded uppercase text-[10px] tracking-widest font-bold ${item.type === 'tv' ? 'bg-[#FFD54F] text-black' : 'bg-white/20 text-white'}`}>
                    {item.type === 'tv' ? 'SERIES' : 'MOVIE'}
                  </span>
                  <span>{item.year}</span>
                  <span>•</span>
                  <span>{item.rating > 0 ? `${item.rating.toFixed(1)} Rating` : 'Unrated'}</span>
                </div>
              </div>
            </a>
          )
        })}

        {finalFeed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-foreground-muted font-medium">You&apos;ve seen it all! Check back later for more recommendations.</span>
          </div>
        )}
      </div>
    </div>
  )
}
