'use client'

import { useState } from 'react'
import { TMDBShowDetails } from '@/lib/tmdb'
import { Check, ChevronRight } from 'lucide-react'
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

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    if (loading) return
    setLoading(true)
    await toggleEpisode(show.id, episode.season, episode.episode, !isWatched)
    setIsWatched(!isWatched)
    setLoading(false)
  }

  if (isWatched) return null 

  return (
    <div className="flex items-center justify-between py-3 pr-4 bg-background transition-all hover:bg-white/5 rounded-md overflow-hidden h-[120px]">
      <Link href={`/show/${show.id}`} className="flex items-center gap-4 flex-1 overflow-hidden cursor-pointer h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={show.poster_path ? (show.poster_path.startsWith('http') ? show.poster_path : `https://image.tmdb.org/t/p/w154${show.poster_path}`) : '/placeholder.jpg'} 
          alt={show.name} 
          className="w-[72px] h-full object-cover rounded-md shadow-md bg-surface-elevated"
        />
        <div className="flex flex-col justify-center overflow-hidden py-1">
          <div className="flex items-center mb-1.5">
            <span className="flex items-center gap-1 text-[9px] font-bold border border-white rounded-full pl-2.5 pr-1.5 py-[2px] text-foreground uppercase tracking-wider w-fit max-w-full">
              <span className="truncate">{show.name}</span>
              <ChevronRight size={10} strokeWidth={3} className="shrink-0" />
            </span>
          </div>
          <div className="flex items-center leading-tight">
            <span className="font-bold text-[15px] text-foreground">S{String(episode.season).padStart(2, '0')} | E{String(episode.episode).padStart(2, '0')}</span>
          </div>
          <span className="text-[13px] text-foreground-muted line-clamp-1 mt-0.5">{episode.name || `Episode ${episode.episode}`}</span>
          <span className="bg-[#FFD54F] text-black text-[9px] font-bold px-1.5 py-[2px] rounded-sm w-fit mt-1.5 tracking-wider">NEW</span>
        </div>
      </Link>
      
      {episode.isAired ? (
        <button 
          onClick={handleToggle}
          disabled={loading}
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ml-4
             bg-white text-foreground-muted
          `}
        >
          <Check size={18} strokeWidth={3} className={loading ? "animate-pulse" : ""} />
        </button>
      ) : (
        <div className="flex flex-col items-end justify-center h-full shrink-0 ml-4">
          <span className="text-[11px] font-bold text-foreground">{episode.timeStr || '6:15 pm'}</span>
          <span className="text-[10px] font-bold text-foreground-muted uppercase mt-0.5">{episode.network || 'SBS'}</span>
        </div>
      )}
    </div>
  )
}
