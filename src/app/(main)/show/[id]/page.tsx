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
    <div className="flex flex-col pb-12 w-full">
      {/* Hero section */}
      <div className="relative w-full h-[50vh] min-h-[400px] flex flex-col justify-end">
        {backdropUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={backdropUrl} alt={show.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/80 to-transparent" />
          </>
        )}
        
        <div className="relative z-10 px-4 pb-6 flex flex-col items-center text-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={posterUrl} alt={show.name} className="w-32 rounded-md shadow-2xl border border-white/10" />
          <h1 className="text-3xl font-black mt-2">{show.name}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-300 font-semibold">
            <span>{new Date(show.first_air_date).getFullYear()}</span>
            <span>•</span>
            <span className="text-[#FFD54F]">{show.status}</span>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-6 -mt-2">
        {user ? (
          <TrackButton showId={show.id} currentStatus={currentStatus} />
        ) : (
          <a href="/login" className="w-full flex items-center justify-center gap-2 py-3 bg-[#FFD54F] text-black rounded-full font-bold">
            Log in to track this show
          </a>
        )}

        <p className="text-gray-300 text-sm leading-relaxed">{show.overview}</p>

        {/* Seasons */}
        <div className="flex flex-col gap-6 mt-4">
          {show.seasons.filter(s => s.season_number > 0).map((season) => (
            <div key={season.id} className="flex flex-col">
              <h2 className="text-xl font-bold bg-[#1E1E1E] px-4 py-3 rounded-t-lg border-b border-[#2A2A2A]">
                Season {season.season_number}
              </h2>
              <div className="bg-[#121212] px-4 rounded-b-lg flex flex-col">
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
      </div>
    </div>
  )
}
