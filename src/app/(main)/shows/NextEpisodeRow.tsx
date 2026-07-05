'use client'

import { useState } from 'react'
import { TMDBShowDetails, TMDBEpisode } from '@/lib/tmdb'
import { Check } from 'lucide-react'
import { toggleEpisode } from '../show/[id]/actions'
import Link from 'next/link'

export function NextEpisodeRow({ 
  show, 
  nextEpisode 
}: { 
  show: TMDBShowDetails, 
  nextEpisode: { season: number, episode: number, name?: string, episodesLeft?: number } 
}) {
  const [loading, setLoading] = useState(false)
  const [isWatched, setIsWatched] = useState(false)

  const handleToggle = async () => {
    if (loading) return
    setLoading(true)
    await toggleEpisode(show.id, nextEpisode.season, nextEpisode.episode, !isWatched)
    setIsWatched(!isWatched)
    setLoading(false)
  }

  if (isWatched) return null // Hide it from this list instantly when watched

  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1E1E1E] transition-all hover:bg-white/5">
      <Link href={`/show/${show.id}`} className="flex items-center gap-4 flex-1 overflow-hidden cursor-pointer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={show.poster_path ? (show.poster_path.startsWith('http') ? show.poster_path : `https://image.tmdb.org/t/p/w154${show.poster_path}`) : '/placeholder.jpg'} 
          alt={show.name} 
          className="w-16 h-24 object-cover rounded-md shadow-md"
        />
        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold border border-gray-600 rounded-full px-2 py-0.5 text-gray-300 uppercase truncate max-w-full">
              {show.name.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white">S{String(nextEpisode.season).padStart(2, '0')} | E{String(nextEpisode.episode).padStart(2, '0')}</span>
            {nextEpisode.episodesLeft && nextEpisode.episodesLeft > 0 ? (
              <span className="text-xs font-bold text-gray-400">+{nextEpisode.episodesLeft}</span>
            ) : null}
          </div>
          <span className="text-sm text-gray-400 line-clamp-1">{nextEpisode.name || `Episode ${nextEpisode.episode}`}</span>
          <span className="bg-[#FFD54F] text-black text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mt-1">NEW</span>
        </div>
      </Link>
      
      <button 
        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
        disabled={loading}
        className="shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors border-gray-600 text-transparent hover:border-[#FFD54F] ml-4 bg-[#1E1E1E]"
      >
        <Check size={16} strokeWidth={4} className={loading ? "animate-pulse" : ""} />
      </button>
    </div>
  )
}
