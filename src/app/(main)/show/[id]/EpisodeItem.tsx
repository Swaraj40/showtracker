'use client'

import { useState, useEffect } from 'react'
import { getSeasonDetails, TMDBEpisode } from '@/lib/tmdb'
import { toggleEpisode } from './actions'
import { Check } from 'lucide-react'

export function EpisodeItem({ 
  showId, 
  seasonNumber, 
  episodeCount,
  watchedEpisodes,
  isLoggedIn
}: { 
  showId: number, 
  seasonNumber: number, 
  episodeCount: number,
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
          isWatched={watchedEpisodes.includes(`${seasonNumber}-${ep.episode_number}`)}
          isLoggedIn={isLoggedIn}
        />
      ))}
    </div>
  )
}

function EpisodeRow({ episode, showId, isWatched, isLoggedIn }: { episode: TMDBEpisode, showId: number, isWatched: boolean, isLoggedIn: boolean }) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (!isLoggedIn || loading) return
    setLoading(true)
    await toggleEpisode(showId, episode.season_number, episode.episode_number, !isWatched)
    setLoading(false)
  }

  return (
    <div 
      onClick={handleToggle}
      className={`flex items-center justify-between py-3 border-b border-[#1E1E1E] transition-all cursor-pointer hover:bg-white/5`}
    >
      <div className="flex flex-col gap-0.5 max-w-[80%]">
        <span className="font-semibold text-[15px] leading-tight text-white line-clamp-1">
          {episode.episode_number}. {episode.name}
        </span>
        <span className="text-xs text-gray-400">{episode.air_date}</span>
      </div>
      {isLoggedIn && (
        <button 
          disabled={loading}
          className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
            isWatched ? 'bg-[#FFD54F] border-[#FFD54F] text-black' : 'border-gray-600 text-transparent hover:border-[#FFD54F]'
          }`}
        >
          <Check size={16} strokeWidth={4} />
        </button>
      )}
    </div>
  )
}
