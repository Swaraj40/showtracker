'use client'

import { ChevronRight } from 'lucide-react'

export type ProfilePoster = {
  id: number
  title: string
  poster_url: string
  url: string
}

type ProfilePosterCarouselProps = {
  title: string
  icon?: React.ReactNode
  items: ProfilePoster[]
}

export function ProfilePosterCarousel({ title, icon, items }: ProfilePosterCarouselProps) {
  return (
    <div className="flex flex-col gap-3 mt-6">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-bold text-foreground tracking-wide">{title}</h2>
        </div>
        <ChevronRight className="text-foreground-muted" size={20} />
      </div>
      
      <div className="flex gap-1 overflow-x-auto px-4 pb-4 no-scrollbar">
        {!items || items.length === 0 ? (
          <div className="flex items-center justify-center w-full h-[165px] md:h-[210px] bg-surface-elevated border border-dashed border-border rounded-sm">
            <span className="text-foreground-muted font-bold text-sm">Nothing added yet</span>
          </div>
        ) : (
          items.map((item) => (
            <a 
              key={item.id} 
              href={item.url}
              className="relative shrink-0 w-[110px] h-[165px] md:w-[140px] md:h-[210px] rounded-[2px] overflow-hidden group shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={item.poster_url} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 bg-surface-elevated"
              />
            </a>
          ))
        )}
      </div>
    </div>
  )
}
