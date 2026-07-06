'use client'

import { TMDBShow } from '@/lib/tmdb'
import Link from 'next/link'
import { Check } from 'lucide-react'

interface ShowCardProps {
  show: TMDBShow | any;
  progress?: {
    watched: number;
    total: number;
  }
}

export function ShowCard({ show, progress }: ShowCardProps) {
  const posterUrl = show.poster_path 
    ? (show.poster_path.startsWith('http') ? show.poster_path : `https://image.tmdb.org/t/p/w500${show.poster_path}`)
    : '/placeholder.jpg'

  const isCompleted = progress && progress.watched >= progress.total && progress.total > 0;
  const progressPercent = progress && progress.total > 0 ? (progress.watched / progress.total) * 100 : 0;

  return (
    <Link 
      href={`/show/${show.id || show.show_id}`}
      className="relative flex flex-col rounded-md overflow-hidden transition-transform active:scale-95"
    >
      <div className="relative aspect-[2/3] w-full bg-surface-elevated">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={posterUrl} 
          alt={show.name}
          className="object-cover w-full h-full"
          loading="lazy"
        />
        
        {/* TV Time Progress Bar */}
        {progress && !isCompleted && (
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-surface-elevated/80">
            <div 
              className="h-full bg-[#FFD54F]" 
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        )}

        {/* TV Time Checkmark Overlay for completed shows */}
        {isCompleted && (
          <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
            <div className="bg-[#FFD54F] rounded-full p-2 text-black shadow-lg">
              <Check size={28} strokeWidth={3} />
            </div>
          </div>
        )}
      </div>
      
      {/* Title only shows if we don't have progress (e.g. Discover page) */}
      {!progress && (
        <div className="p-2 truncate text-xs font-semibold text-center text-foreground">
          {show.name}
        </div>
      )}
    </Link>
  )
}
