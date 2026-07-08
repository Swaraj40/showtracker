'use client'

import { useState } from 'react'
import { TMDBShowDetails } from '@/lib/tmdb'
import { Check, ChevronRight, Eye, Loader2 } from 'lucide-react'
import { markWatchedAndGetNext } from '../show/[id]/actions'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CharacterPoll } from '@/components/CharacterPoll'

type State = 'idle' | 'marking' | 'progress' | 'poll_ready' | 'done'

export function NextEpisodeRow({ 
  show, 
  nextEpisode 
}: { 
  show: TMDBShowDetails, 
  nextEpisode: { season: number, episode: number, name?: string, episodesLeft?: number } 
}) {
  const [state, setState] = useState<State>('idle')
  const [currentEp, setCurrentEp] = useState(nextEpisode)

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();

    if (state !== 'idle') return

    setState('marking')
    
    // Simulate some delay for the "Mark as watched" state
    setTimeout(async () => {
      setState('progress')
      
      const nextEpData = await markWatchedAndGetNext(show.id, currentEp.season, currentEp.episode)
      
      setTimeout(() => {
        if (!nextEpData) {
          setState('done')
        } else {
          setCurrentEp(nextEpData)
          setState('idle') // Changed from 'poll_ready' to 'idle' to disable survey
        }
      }, 1500) 
    }, 1200)
  }

  if (state === 'done') return null

  const renderIdleCard = () => (
    <div className="flex items-center justify-between py-3 pr-4 h-[120px] hover:bg-white/5 transition-all duration-300">
      <Link href={`/show/${show.id}`} className="flex items-center gap-4 flex-1 overflow-hidden cursor-pointer h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={show.poster_path ? (show.poster_path.startsWith('http') ? show.poster_path : `https://image.tmdb.org/t/p/w154${show.poster_path}`) : '/placeholder.jpg'} 
          alt={show.name} 
          className="w-[72px] h-full object-cover rounded-md shadow-md"
        />
        <div className="flex flex-col justify-center overflow-hidden py-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1 text-[9px] font-bold border border-white rounded-full pl-2.5 pr-1.5 py-[2px] text-foreground uppercase tracking-wider w-fit max-w-full">
              <span className="truncate">{show.name}</span>
              <ChevronRight size={10} strokeWidth={3} className="shrink-0" />
            </span>
          </div>
          <div className="flex items-center gap-2 leading-tight">
            <span className="font-bold text-[15px] text-foreground">S{String(currentEp.season).padStart(2, '0')} | E{String(currentEp.episode).padStart(2, '0')}</span>
            {currentEp.episodesLeft && currentEp.episodesLeft > 0 ? (
              <span className="text-[11px] font-bold text-foreground-muted">+{currentEp.episodesLeft}</span>
            ) : null}
          </div>
          <span className="text-[13px] text-foreground-muted line-clamp-1 mt-0.5">{currentEp.name || `Episode ${currentEp.episode}`}</span>
          <span className="bg-[#FFD54F] text-black text-[9px] font-bold px-1.5 py-[2px] rounded-sm w-fit mt-1.5 tracking-wider">NEW</span>
        </div>
      </Link>
      
      <button 
        onClick={handleToggle}
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ml-4 bg-white text-foreground-muted hover:scale-110"
      >
        <Check size={18} strokeWidth={3} />
      </button>
    </div>
  )

  const renderMarkingState = () => (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="flex items-center justify-center w-full h-[120px] bg-[#66CC00] rounded-md gap-3 shadow-lg my-2"
    >
      <Eye className="text-foreground" size={36} strokeWidth={2.5} />
      <span className="text-foreground font-bold text-[28px] tracking-wide">Mark as watched</span>
    </motion.div>
  )

  const renderProgressState = () => (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="flex flex-col items-center justify-center w-full h-[120px] bg-[#66CC00] rounded-md shadow-lg my-2"
    >
      <span className="text-foreground text-[15px] font-medium tracking-wide mb-3">
        {currentEp.episodesLeft ? `${currentEp.episodesLeft} more episodes` : 'Loading next episode...'}
      </span>
      {/* Custom spinner matching image */}
      <svg className="animate-spin h-8 w-8 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
    </motion.div>
  )

  return (
    <motion.div layout className="border-b border-border overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div key="idle" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
            {renderIdleCard()}
          </motion.div>
        )}
        
        {state === 'marking' && (
          <motion.div key="marking" layout>
            {renderMarkingState()}
          </motion.div>
        )}

        {state === 'progress' && (
          <motion.div key="progress" layout>
            {renderProgressState()}
          </motion.div>
        )}

        {state === 'poll_ready' && (
          <motion.div key="poll_ready" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            {renderIdleCard()}
            {show.credits?.cast && show.credits.cast.length >= 2 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                className="overflow-hidden"
              >
                <CharacterPoll characters={show.credits.cast} />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
