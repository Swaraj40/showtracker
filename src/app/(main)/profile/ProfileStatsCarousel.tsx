'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export function ProfileStatsCarousel({ 
  episodeCount, 
  movieCount 
}: { 
  episodeCount: number, 
  movieCount: number 
}) {
  const tvMonths = Math.floor((episodeCount * 45) / (60 * 24 * 30))
  const tvDays = Math.floor(((episodeCount * 45) % (60 * 24 * 30)) / (60 * 24))
  const tvHours = Math.floor(((episodeCount * 45) % (60 * 24)) / 60)

  const mMonths = Math.floor((movieCount * 120) / (60 * 24 * 30))
  const mDays = Math.floor(((movieCount * 120) % (60 * 24 * 30)) / (60 * 24))
  const mHours = Math.floor(((movieCount * 120) % (60 * 24)) / 60)

  return (
    <div className="flex flex-col gap-2 mt-4">
      <Link href="/profile/statistics" className="flex items-center justify-between px-4 group cursor-pointer">
        <h2 className="text-xl font-bold text-foreground tracking-wide group-hover:text-[#FFD54F] transition-colors">Stats</h2>
        <ChevronRight className="text-foreground-muted group-hover:text-[#FFD54F] transition-colors" size={20} />
      </Link>
      
      <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full pb-4 px-4 gap-4">
        {/* Slide 1: TV Stats */}
        <div className="snap-center shrink-0 w-full md:w-[600px] flex gap-2">
          {/* TV Time */}
          <div className="flex-[3] border border-border rounded-md bg-background flex flex-col h-[100px]">
            <div className="flex items-center justify-center gap-2 py-2 border-b border-border">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground-muted"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
              <span className="text-[13px] font-bold text-foreground tracking-wide">TV time</span>
            </div>
            <div className="flex items-center justify-evenly h-full pb-1">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-foreground">{tvMonths}</span>
                <span className="text-[9px] font-bold text-foreground-muted tracking-widest mt-[-2px]">MONTHS</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-foreground">{tvDays}</span>
                <span className="text-[9px] font-bold text-foreground-muted tracking-widest mt-[-2px]">DAYS</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-foreground">{tvHours}</span>
                <span className="text-[9px] font-bold text-foreground-muted tracking-widest mt-[-2px]">HOURS</span>
              </div>
            </div>
          </div>

          {/* Episodes watched */}
          <div className="flex-[2] border border-border rounded-md bg-background flex flex-col h-[100px]">
            <div className="flex items-center justify-center gap-2 py-2 border-b border-border">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground-muted"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <span className="text-[13px] font-bold text-foreground tracking-wide">Episodes watched</span>
            </div>
            <div className="flex items-center justify-center h-full pb-1">
              <span className="text-[28px] font-bold text-foreground">{episodeCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Slide 2: Movie Stats */}
        <div className="snap-center shrink-0 w-full md:w-[600px] flex gap-2">
          {/* Movie Time */}
          <div className="flex-[3] border border-border rounded-md bg-background flex flex-col h-[100px]">
            <div className="flex items-center justify-center gap-2 py-2 border-b border-border">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground-muted"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
              <span className="text-[13px] font-bold text-foreground tracking-wide">Movie time</span>
            </div>
            <div className="flex items-center justify-evenly h-full pb-1">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-foreground">{mMonths}</span>
                <span className="text-[9px] font-bold text-foreground-muted tracking-widest mt-[-2px]">MONTHS</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-foreground">{mDays}</span>
                <span className="text-[9px] font-bold text-foreground-muted tracking-widest mt-[-2px]">DAYS</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-foreground">{mHours}</span>
                <span className="text-[9px] font-bold text-foreground-muted tracking-widest mt-[-2px]">HOURS</span>
              </div>
            </div>
          </div>

          {/* Movies watched */}
          <div className="flex-[2] border border-border rounded-md bg-background flex flex-col h-[100px]">
            <div className="flex items-center justify-center gap-2 py-2 border-b border-border">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground-muted"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
              <span className="text-[13px] font-bold text-foreground tracking-wide">Movies watched</span>
            </div>
            <div className="flex items-center justify-center h-full pb-1">
              <span className="text-[28px] font-bold text-foreground">{movieCount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
