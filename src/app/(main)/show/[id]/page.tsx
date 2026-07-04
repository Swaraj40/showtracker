export const dynamic = "force-dynamic"

import { getShowDetails } from '@/lib/tmdb'
import { createClient } from '@/utils/supabase/server'
import { TrackButton } from './TrackButton'
import { EpisodeItem } from './EpisodeItem'

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const show = await getShowDetails(p.id)
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentStatus = null
  let watchedEpisodes = new Set<string>()

  if (user) {
    const { data: showData } = await supabase
      .from('user_shows')
      .select('status')
      .eq('show_id', show.id)
      .eq('user_id', user.id)
      .single()
    
    if (showData) currentStatus = showData.status

    const { data: episodeData } = await supabase
      .from('user_episodes')
      .select('season_number, episode_number')
      .eq('show_id', show.id)
      .eq('user_id', user.id)

    if (episodeData) {
      episodeData.forEach(e => watchedEpisodes.add(`${e.season_number}-${e.episode_number}`))
    }
  }

  const posterUrl = show.poster_path ? (show.poster_path.startsWith('http') ? show.poster_path : `https://image.tmdb.org/t/p/w500${show.poster_path}`) : '/placeholder.jpg'
  const backdropUrl = show.backdrop_path ? (show.backdrop_path.startsWith('http') ? show.backdrop_path : `https://image.tmdb.org/t/p/original${show.backdrop_path}`) : ''

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Hero section */}
      <div className="relative w-full h-[40vh] md:h-[60vh] rounded-3xl overflow-hidden shadow-2xl">
        {backdropUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backdropUrl} alt={show.name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent flex items-end p-8">
          <div className="flex flex-col md:flex-row gap-8 items-end w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={posterUrl} alt={show.name} className="w-32 md:w-48 rounded-xl shadow-2xl hidden md:block" />
            <div className="flex-1 flex flex-col gap-4">
              <h1 className="text-4xl md:text-6xl font-black">{show.name}</h1>
              <p className="text-gray-300 line-clamp-3 text-lg max-w-3xl">{show.overview}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-semibold border border-blue-600/30">
                  {show.status}
                </span>
                <span className="text-gray-400 text-sm">{show.first_air_date}</span>
              </div>
              
              {user ? (
                <div className="mt-4">
                  <TrackButton showId={show.id} currentStatus={currentStatus} />
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-400">Log in to track this show</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seasons */}
      {show.seasons.filter(s => s.season_number > 0).map((season) => (
        <div key={season.id} className="flex flex-col gap-4 mt-8">
          <h2 className="text-2xl font-bold border-b border-gray-800 pb-2">Season {season.season_number}</h2>
          <div className="flex flex-col gap-2">
            <EpisodeItem 
              showId={show.id} 
              seasonNumber={season.season_number} 
              episodeCount={season.episode_count}
              watchedEpisodes={Array.from(watchedEpisodes)}
              isLoggedIn={!!user}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
