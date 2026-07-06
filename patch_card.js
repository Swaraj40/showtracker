const fs = require('fs');

const content = `'use client'

import { useState } from 'react'
import { TMDBShowDetails } from '@/lib/tmdb'
import { Check, ChevronRight } from 'lucide-react'
import { markWatchedAndGetNext } from '../show/[id]/actions'
import Link from 'next/link'

export function NextEpisodeRow({ 
  show, 
  nextEpisode 
}: { 
  show: TMDBShowDetails, 
  nextEpisode: { season: number, episode: number, name?: string, episodesLeft?: number } 
}) {
  const [state, setState] = useState<'idle' | 'success' | 'animating' | 'done'>('idle')
  const [currentEp, setCurrentEp] = useState(nextEpisode)

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();

    if (state !== 'idle') return

    setState('success')
    const nextEpData = await markWatchedAndGetNext(show.id, currentEp.season, currentEp.episode)
    
    setTimeout(() => {
      setState('animating')
      
      setTimeout(() => {
        if (!nextEpData) {
          setState('done')
        } else {
          setCurrentEp(nextEpData)
          setState('idle')
        }
      }, 300)
      
    }, 800)
  }

  if (state === 'done') return null

  return (
    <div 
      className={\`flex items-center justify-between py-3 pr-4 border-b border-[#1E1E1E] hover:bg-white/5 transition-all duration-300 ease-in-out overflow-hidden
        \${state === 'animating' ? 'opacity-0 scale-95 h-[100px]' : 'opacity-100 scale-100 h-[120px]'}
      \`}
    >
      <Link href={\`/show/\${show.id}\`} className="flex items-center gap-4 flex-1 overflow-hidden cursor-pointer h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={show.poster_path ? (show.poster_path.startsWith('http') ? show.poster_path : \`https://image.tmdb.org/t/p/w154\${show.poster_path}\`) : '/placeholder.jpg'} 
          alt={show.name} 
          className="w-[72px] h-full object-cover rounded-md shadow-md"
        />
        <div className="flex flex-col justify-center overflow-hidden py-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1 text-[9px] font-bold border border-white rounded-full pl-2.5 pr-1.5 py-[2px] text-white uppercase tracking-wider w-fit max-w-full">
              <span className="truncate">{show.name}</span>
              <ChevronRight size={10} strokeWidth={3} className="shrink-0" />
            </span>
          </div>
          <div className="flex items-center gap-2 leading-tight">
            <span className="font-bold text-[15px] text-white">S{String(currentEp.season).padStart(2, '0')} | E{String(currentEp.episode).padStart(2, '0')}</span>
            {currentEp.episodesLeft && currentEp.episodesLeft > 0 ? (
              <span className="text-[11px] font-bold text-gray-400">+{currentEp.episodesLeft}</span>
            ) : null}
          </div>
          <span className="text-[13px] text-gray-300 line-clamp-1 mt-0.5">{currentEp.name || \`Episode \${currentEp.episode}\`}</span>
          <span className="bg-[#FFD54F] text-black text-[9px] font-bold px-1.5 py-[2px] rounded-sm w-fit mt-1.5 tracking-wider">NEW</span>
        </div>
      </Link>
      
      <button 
        onClick={handleToggle}
        disabled={state !== 'idle'}
        className={\`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ml-4
          \${state === 'success' || state === 'animating'
            ? 'bg-[#34D399] text-white scale-110 shadow-[0_0_15px_rgba(52,211,153,0.5)]' 
            : 'bg-white text-gray-500'
          }
        \`}
      >
        <Check size={18} strokeWidth={3} />
      </button>
    </div>
  )
}
`;

fs.writeFileSync('src/app/(main)/shows/NextEpisodeRow.tsx', content);
