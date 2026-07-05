'use client'

import { useState } from 'react'
import { TMDBShowDetails } from '@/lib/tmdb'
import { Check } from 'lucide-react'
import { toggleEpisode } from '../show/[id]/actions'
import Link from 'next/link'

export function UpcomingEpisodeRow({ 
  show, 
  episode 
}: { 
  show: TMDBShowDetails, 
  episode: { season: number, episode: number, name?: string, airDate: string, network?: string, isAired: boolean, timeStr?: string } 
}) {
  const [loading, setLoading] = useState(false)
  const [isWatched, setIsWatched] = useState(false)

  const handleToggle = async () => {
    if (loading) return
    setLoading(true)
    await toggleEpisode(show.id, episode.season, episode.episode, !isWatched)
    setIsWatched(!isWatched)
    setLoading(false)
  }

  // If the user watches it from the Upcoming tab, we could hide it or just show it checked.
  // We'll hide it for consistency.
  if (isWatched) return null 

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-black transition-all hover:bg-white/5 rounded-md">
      <Link href={`/show/${show.id}`} className="flex items-center gap-4 flex-1 overflow-hidden cursor-pointer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={show.poster_path ? (show.poster_path.startsWith('http') ? show.poster_path : `https://image.tmdb.org/t/p/w154${show.poster_path}`) : '/placeholder.jpg'} 
          alt={show.name} 
          className="w-20 h-28 object-cover rounded-md shadow-md bg-[#1E1E1E]"
        />
        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="flex items-center">
            <span className="flex items-center gap-0.5 text-[9px] font-bold border border-gray-400 rounded-full pl-2 pr-1 py-0.5 text-gray-200 uppercase truncate max-w-full">
              <span className="truncate">{show.name}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
          </div>
          <div className="flex items-center mt-1">
            <span className="font-bold text-[17px] text-white">S{String(episode.season).padStart(2, '0')} | E{String(episode.episode).padStart(2, '0')}</span>
          </div>
          <span className="text-[13px] text-gray-300 line-clamp-1">{episode.name || `Episode ${episode.episode}`}</span>
          <span className="bg-[#FFD54F] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm w-fit mt-1">NEW</span>
        </div>
      </Link>
      
      {episode.isAired ? (
        <button 
          onClick={(e) => { e.stopPropagation(); handleToggle(); }}
          disabled={loading}
          className="shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors border-gray-600 text-transparent hover:border-[#FFD54F] ml-4 bg-[#1E1E1E]"
        >
          <Check size={16} strokeWidth={4} className={loading ? "animate-pulse" : ""} />
        </button>
      ) : (
        <div className="flex flex-col items-end justify-start h-full self-start pt-2 shrink-0 ml-4">
          <span className="text-[11px] font-bold text-white">{episode.timeStr || '6:15 pm'}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{episode.network || 'SBS'}</span>
        </div>
      )}
    </div>
  )
}
