'use client'

import { useState, useRef } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

type StatsData = {
  shows: {
    totalHours: number
    hoursLast7Days: number
    totalEpisodes: number
    episodesLast7Days: number
    monthlyData: { month: string; hours: number; count: number; isCurrent: boolean }[]
    weeklyData: { week: string; count: number; isCurrent: boolean }[]
    biggestMarathons: { showName: string; episodes: number; hours: number }[]
    addedShows: number
    inProductionShows: number
    topGenres: { name: string; count: number }[]
    topNetworks: { name: string; count: number }[]
  }
  movies: {
    totalHours: number
    hoursLast7Days: number
    totalMovies: number
    moviesLast7Days: number
    monthlyData: { month: string; hours: number; count: number; isCurrent: boolean }[]
    weeklyData: { week: string; count: number; isCurrent: boolean }[]
    topGenres: { name: string; count: number }[]
  }
}

function CarouselCard({ title, children }: { title?: string, children: React.ReactNode[] }) {
  const [active, setActive] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft
    const width = e.currentTarget.clientWidth
    const newActive = Math.round(scrollLeft / width)
    if (newActive !== active) setActive(newActive)
  }

  return (
    <div className="bg-[#0B0B0B] border border-border rounded-md mb-4 flex flex-col overflow-hidden shadow-md">
      {title && (
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-foreground font-bold text-lg">{title}</h2>
        </div>
      )}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {children.map((child, i) => (
          <div key={i} className="min-w-full snap-center px-4 pb-4">
            {child}
          </div>
        ))}
      </div>
      {children.length > 1 && (
        <div className="flex justify-center gap-1.5 py-3 border-t border-border bg-background">
          {children.map((_, i) => (
            <div key={i} className={`w-[5px] h-[5px] rounded-full transition-colors ${i === active ? 'bg-[#FFD54F]' : 'bg-[#404040]'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

function BarChart({ data, yLabel, xLabel, dataKey, yAxisFormatter }: { data: any[], yLabel: string, xLabel: string, dataKey: string, yAxisFormatter?: (val: number) => string | number }) {
  const maxVal = Math.max(...data.map(d => d[dataKey]), 1)
  
  return (
    <div className="flex flex-col mt-4">
      <div className="flex">
        {/* Y-axis label */}
        <div className="flex flex-col justify-center items-center w-8">
          <span className="text-[10px] font-bold text-foreground-muted -rotate-90 tracking-widest whitespace-nowrap">{yLabel}</span>
        </div>
        
        {/* Chart area */}
        <div className="flex-1 flex items-end justify-between border-b border-[#333333] pb-1 h-[140px] px-1 relative">
          {data.map((d, i) => {
            const heightPct = (d[dataKey] / maxVal) * 100
            return (
              <div key={i} className="flex flex-col items-center justify-end w-full group relative" style={{ height: '100%' }}>
                <span className="text-[10px] text-foreground-muted mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4">{yAxisFormatter ? yAxisFormatter(d[dataKey]) : d[dataKey]}</span>
                <div 
                  className={`w-[60%] mx-auto rounded-t-sm transition-all ${d.isCurrent ? 'bg-[#4ADE80]' : 'bg-[#666666]'}`}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
              </div>
            )
          })}
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex ml-8 px-1 mt-1 justify-between">
        {data.map((d, i) => (
          <div key={i} className="w-full text-center">
            <span className="text-[10px] font-bold text-foreground-muted">{d.month || d.week}</span>
          </div>
        ))}
      </div>
      <div className="text-center mt-3">
        <span className="text-[10px] font-bold text-foreground-muted tracking-widest uppercase">{xLabel}</span>
      </div>
    </div>
  )
}

export function StatisticsClient({ statsData }: { statsData: StatsData }) {
  const router = useRouter()
  const [tab, setTab] = useState<'SHOWS' | 'MOVIES'>('SHOWS')

  const data = tab === 'SHOWS' ? statsData.shows : statsData.movies

  return (
    <div className="flex flex-col w-full bg-background min-h-screen text-foreground font-sans">
      {/* Header */}
      <div className="flex items-center justify-center relative py-4 bg-background">
        <button onClick={() => router.back()} className="absolute left-4 p-1">
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-[16px] font-bold">Stats</h1>
      </div>

      {/* Tabs */}
      <div className="flex w-full border-b border-border bg-background">
        <button 
          onClick={() => setTab('SHOWS')}
          className={`flex-1 py-3 text-[13px] font-bold tracking-widest transition-colors border-b-2 ${tab === 'SHOWS' ? 'border-white text-foreground' : 'border-transparent text-foreground-muted'}`}
        >
          SHOWS
        </button>
        <button 
          onClick={() => setTab('MOVIES')}
          className={`flex-1 py-3 text-[13px] font-bold tracking-widest transition-colors border-b-2 ${tab === 'MOVIES' ? 'border-white text-foreground' : 'border-transparent text-foreground-muted'}`}
        >
          MOVIES
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col px-3 py-4 gap-2 pb-20">
        
        {/* Time Spent */}
        <CarouselCard>
          <div>
            <h2 className="text-foreground font-bold text-lg mb-4">Time spent watching {tab === 'SHOWS' ? 'episodes' : 'movies'}</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-[42px] font-bold leading-none">{data.totalHours.toLocaleString()}</span>
              <span className="text-sm text-foreground-muted">hours</span>
            </div>
            <p className="text-[10px] font-bold text-foreground tracking-widest mt-2 uppercase">{data.hoursLast7Days} HOURS IN THE LAST 7 DAYS</p>
            
            <div className="mt-6 pt-4 border-t border-border flex justify-center">
              <button className="text-[#007AFF] text-sm font-bold tracking-wide uppercase">Compare with the people you follow</button>
            </div>
          </div>
          
          <div>
            <h2 className="text-foreground font-bold text-lg">Time spent watching {tab === 'SHOWS' ? 'episodes' : 'movies'}</h2>
            <BarChart 
              data={data.monthlyData} 
              yLabel="HOURS" 
              xLabel="PER MONTH" 
              dataKey="hours" 
            />
          </div>
        </CarouselCard>

        {/* Total Count */}
        <CarouselCard>
          <div>
            <h2 className="text-foreground font-bold text-lg mb-4">Total {tab === 'SHOWS' ? 'episodes' : 'movies'} watched</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-[42px] font-bold leading-none">{tab === 'SHOWS' ? statsData.shows.totalEpisodes.toLocaleString() : statsData.movies.totalMovies.toLocaleString()}</span>
            </div>
            <p className="text-[10px] font-bold text-foreground tracking-widest mt-2 uppercase">
              {tab === 'SHOWS' ? statsData.shows.episodesLast7Days : statsData.movies.moviesLast7Days} IN THE LAST 7 DAYS
            </p>
          </div>
          
          <div>
            <h2 className="text-foreground font-bold text-lg">{tab === 'SHOWS' ? 'Episodes' : 'Movies'} watched</h2>
            <BarChart 
              data={data.weeklyData} 
              yLabel={tab === 'SHOWS' ? 'EPISODES' : 'MOVIES'} 
              xLabel="PER WEEK" 
              dataKey="count" 
            />
          </div>
        </CarouselCard>

        {/* Biggest Marathons (Shows only) */}
        {tab === 'SHOWS' && statsData.shows.biggestMarathons.length > 0 && (
          <div className="bg-[#0B0B0B] border border-border rounded-md p-4 mb-2 shadow-md">
            <h2 className="text-foreground font-bold text-lg mb-4">Biggest marathons</h2>
            
            <div className="flex justify-between items-center text-[10px] font-bold text-foreground-muted tracking-widest mb-3 uppercase">
              <span className="flex-1">SHOW</span>
              <span className="w-16 text-right">EPISODES</span>
              <span className="w-16 text-right">HOURS</span>
            </div>
            
            <div className="flex flex-col gap-4">
              {statsData.shows.biggestMarathons.map((m, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground flex-1 truncate pr-2">{m.showName}</span>
                  <span className="w-16 text-right text-sm text-foreground">{m.episodes}</span>
                  <span className="w-16 text-right text-sm text-foreground">{m.hours}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Added Items */}
        <div className="bg-[#0B0B0B] border border-border rounded-md p-4 mb-2 shadow-md">
          <h2 className="text-foreground font-bold text-lg mb-3">Added {tab === 'SHOWS' ? 'shows' : 'movies'}</h2>
          <div className="text-[42px] font-bold leading-none">
            {tab === 'SHOWS' ? statsData.shows.addedShows.toLocaleString() : statsData.movies.totalMovies.toLocaleString()}
          </div>
          {tab === 'SHOWS' && (
            <p className="text-[10px] font-bold text-foreground tracking-widest mt-2 uppercase">
              {statsData.shows.inProductionShows} STILL IN PRODUCTION
            </p>
          )}
        </div>

        {/* Top Genres */}
        {data.topGenres.length > 0 && (
          <div className="bg-[#0B0B0B] border border-border rounded-md p-4 mb-2 shadow-md">
            <h2 className="text-foreground font-bold text-lg mb-4">Top {tab === 'SHOWS' ? 'show' : 'movie'} genres</h2>
            
            <div className="flex justify-between items-center text-[10px] font-bold text-foreground-muted tracking-widest mb-3 uppercase">
              <span>GENRE</span>
              <span>{tab === 'SHOWS' ? 'SHOWS' : 'MOVIES'}</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {data.topGenres.map((g, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{g.name}</span>
                  <span className="text-sm text-foreground">{g.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Networks (Shows only) */}
        {tab === 'SHOWS' && statsData.shows.topNetworks.length > 0 && (
          <div className="bg-[#0B0B0B] border border-border rounded-md p-4 mb-2 shadow-md">
            <h2 className="text-foreground font-bold text-lg mb-4">Top show networks</h2>
            
            <div className="flex justify-between items-center text-[10px] font-bold text-foreground-muted tracking-widest mb-3 uppercase">
              <span>NETWORK</span>
              <span>SHOWS</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {statsData.shows.topNetworks.map((n, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{n.name}</span>
                  <span className="text-sm text-foreground">{n.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
