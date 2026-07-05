'use client'

import { useState, useEffect } from 'react'
import { getSeasonDetails, TMDBEpisode } from '@/lib/tmdb'
import { toggleEpisode } from './actions'
import { Check } from 'lucide-react'

export function EpisodeItem({ 
  showId, 
  seasonNumber, 
  episodeCount,
  showPoster,
  seasonPoster,
  watchedEpisodes,
  isLoggedIn
}: { 
  showId: number, 
  seasonNumber: number, 
  episodeCount: number,
  showPoster: string | null,
  seasonPoster: string | null,
  watchedEpisodes: string[],
  isLoggedIn: boolean
}) {
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSeasonDetails(showId, seasonNumber).then(data => {
      setEpisodes(data)
      setLoading(false)
    })
  }, [showId, seasonNumber])

  if (loading) return <div className="text-gray-500 p-4 animate-pulse">Loading episodes...</div>

  return (
    <div className="flex flex-col">
      {episodes.map(ep => (
        <EpisodeRow 
          key={ep.id} 
          episode={ep} 
          showId={showId} 
          showPoster={showPoster}
          seasonPoster={seasonPoster}
          isWatched={watchedEpisodes.includes(`${seasonNumber}-${ep.episode_number}`)}
          isLoggedIn={isLoggedIn}
        />
      ))}
    </div>
  )
}

function EpisodeRow({ 
  episode, 
  showId, 
  showPoster, 
  seasonPoster, 
  isWatched, 
  isLoggedIn 
}: { 
  episode: TMDBEpisode, 
  showId: number, 
  showPoster: string | null,
  seasonPoster: string | null,
  isWatched: boolean, 
  isLoggedIn: boolean 
}) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (!isLoggedIn || loading || !isAired) return
    setLoading(true)
    await toggleEpisode(showId, episode.season_number, episode.episode_number, !isWatched)
    setLoading(false)
  }

  const epDate = episode.air_date ? new Date(episode.air_date) : null
  const today = new Date()
  today.setHours(0,0,0,0)
  
  let isAired = false
  let daysUntil = 0
  if (epDate) {
    const diffTime = epDate.getTime() - today.getTime()
    daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    isAired = daysUntil <= 0
  }

  const fallbackImage = seasonPoster || showPoster
  const imageUrl = episode.still_path 
    ? (episode.still_path.startsWith('http') ? episode.still_path : `https://image.tmdb.org/t/p/w185${episode.still_path}`)
    : (fallbackImage ? (fallbackImage.startsWith('http') ? fallbackImage : `https://image.tmdb.org/t/p/w185${fallbackImage}`) : null)

  return (
    <div 
      onClick={handleToggle}
      className={`flex items-center justify-between py-3 border-b border-[#1E1E1E] transition-all cursor-pointer hover:bg-white/5 pl-4 pr-4`}
    >
      <div className="flex items-center gap-4 max-w-[70%]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={imageUrl} 
            className="w-16 h-16 object-cover rounded-md flex-shrink-0 bg-gray-800" 
            alt="Episode thumbnail"
          />
        ) : (
          <div className="w-16 h-16 rounded-md flex-shrink-0 bg-[#2A2A2A]" />
        )}
        
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-[15px] leading-tight text-white line-clamp-1">
            S{String(episode.season_number).padStart(2, '0')} | E{String(episode.episode_number).padStart(2, '0')}
          </span>
          <span className="text-sm text-gray-400">Episode {episode.episode_number}</span>
        </div>
      </div>
      
      {isLoggedIn && (
        <div className="shrink-0 pl-2">
          {isAired ? (
             <button 
               disabled={loading}
               className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                 isWatched 
                   ? 'bg-[#34D399] text-white' // Green check
                   : 'bg-white text-black' // White/Grey check
               }`}
             >
               <Check size={18} strokeWidth={4} />
             </button>
          ) : (
             <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-gray-400">{daysUntil}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">DAYS</span>
             </div>
          )}
        </div>
      )}
    </div>
  )
}
