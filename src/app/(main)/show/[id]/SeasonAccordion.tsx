'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import { EpisodeItem } from './EpisodeItem'

export function SeasonAccordion({ 
  showId, 
  season, 
  showPoster,
  watchedEpisodes, 
  isLoggedIn 
}: { 
  showId: number, 
  season: { season_number: number, episode_count: number, name: string, poster_path?: string },
  showPoster: string | null,
  watchedEpisodes: string[],
  isLoggedIn: boolean
}) {
  const [isOpen, setIsOpen] = useState(season.season_number === 1) // Default open season 1
  
  // Calculate how many episodes in this season are watched
  const watchedInSeason = watchedEpisodes.filter(id => id.startsWith(`${season.season_number}-`)).length

  return (
    <div className="flex flex-col mb-1 border-b border-[#2A2A2A]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between py-4 px-4 w-full text-left focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-white">{season.name}</span>
          {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400">{watchedInSeason}/{season.episode_count}</span>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${watchedInSeason === season.episode_count ? 'bg-white border-white text-black' : 'border-gray-500 text-transparent'}`}>
            <Check size={14} strokeWidth={4} />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="flex flex-col bg-black">
          <EpisodeItem 
            showId={showId} 
            seasonNumber={season.season_number} 
            episodeCount={season.episode_count}
            showPoster={showPoster}
            seasonPoster={season.poster_path || null}
            watchedEpisodes={watchedEpisodes}
            isLoggedIn={isLoggedIn}
          />
        </div>
      )}
    </div>
  )
}
