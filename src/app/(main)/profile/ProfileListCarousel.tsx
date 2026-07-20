'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export type CustomList = {
  id: string
  name: string
  cover_url: string
}

type ProfileListCarouselProps = {
  title: string
  lists: CustomList[]
  href?: string
}

export function ProfileListCarousel({ title, lists, href }: ProfileListCarouselProps) {
  return (
    <div className="flex flex-col gap-3 mt-4">
      {href ? (
        <Link href={href} className="flex items-center justify-between px-4">
          <h2 className="text-xl font-bold text-foreground tracking-wide">{title}</h2>
          <ChevronRight className="text-foreground-muted" size={20} />
        </Link>
      ) : (
        <div className="flex items-center justify-between px-4">
          <h2 className="text-xl font-bold text-foreground tracking-wide">{title}</h2>
        </div>
      )}
      
      <div className="flex overflow-x-auto snap-x snap-mandatory px-4 pb-2 no-scrollbar gap-4 w-full">
        {!lists || lists.length === 0 ? (
          <div className="shrink-0 snap-center flex items-center justify-center w-[90vw] md:w-[600px] aspect-[2/1] bg-surface-elevated border border-dashed border-border rounded-lg">
            <span className="text-foreground-muted font-bold text-sm">No custom lists yet</span>
          </div>
        ) : (
          lists.map((list) => (
            <Link 
              href={`/profile/lists/${list.id}`}
              key={list.id} 
              className="shrink-0 snap-center relative w-[90vw] md:w-[600px] aspect-[2.2/1] rounded-lg overflow-hidden group shadow-md cursor-pointer block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={list.cover_url} 
                alt={list.name} 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 bg-surface-elevated"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
              <span className="absolute bottom-3 left-4 text-foreground text-xl font-bold drop-shadow-lg tracking-wide">{list.name}</span>
            </Link>
          ))
        )}
      </div>
      
      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <div className="w-1.5 h-1.5 rounded-full bg-[#FFD54F]"></div>
        {lists.length > 1 && lists.slice(1).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
        ))}
      </div>
    </div>
  )
}
