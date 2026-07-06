import { TMDBShowDetails } from '@/lib/tmdb'
import { PlayCircle, Clock, Users, Star, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export function AboutTab({ show, commentsCount = 0 }: { show: TMDBShowDetails, commentsCount?: number }) {
  // Format subtitle
  const isAiring = show.status === 'Returning Series' || show.status === 'In Production'
  const statusStr = isAiring ? 'Present' : (show.status || 'Ended')
  const genresStr = show.genres?.map(g => g.name).join(', ') || 'Drama'
  
  // Format runtime
  const runtime = show.episode_run_time?.[0] || 45
  
  // Mock some TV Time specific data
  const tvTimeRating = ((show.vote_average || 0) / 2).toFixed(1)
  const trailer = show.videos?.results?.find(v => v.type === 'Trailer')

  return (
    <div className="flex flex-col gap-6 p-4">
      
      {/* Show info section */}
      <section className="flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="text-2xl font-black text-foreground">{show.name}</h1>
        
        <p className="text-sm text-foreground-muted">
          {statusStr} • {genresStr}
        </p>

        <div className="flex items-center gap-4 mt-1">
          <div className="flex items-center gap-2">
            <div className="bg-[#FFD54F] text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm">T</div>
            <div className="flex text-[#FFD54F] text-xs">
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
              <Star size={12} className="opacity-50" />
            </div>
            <span className="text-xs font-bold text-foreground ml-1">{tvTimeRating}/5</span>
          </div>
          
          {show.external_ids?.imdb_id ? (
            <a 
              href={`https://www.imdb.com/title/${show.external_ids.imdb_id}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border-l border-gray-700 pl-4 hover:opacity-80 transition-opacity"
            >
              <div className="bg-[#F5C518] text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm">IMDb</div>
              <span className="text-xs font-bold text-foreground">{show.vote_average ? show.vote_average.toFixed(1) : 'N/A'}</span>
            </a>
          ) : (
            <div className="flex items-center gap-1.5 border-l border-gray-700 pl-4">
              <div className="bg-[#F5C518] text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm">IMDb</div>
              <span className="text-xs font-bold text-foreground">{show.vote_average ? show.vote_average.toFixed(1) : 'N/A'}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-foreground mt-2 leading-relaxed">
          {show.overview || "No overview available for this show."}
        </p>

        {/* Trailer */}
        {trailer && (
          <div className="flex items-center gap-4 mt-4 cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded-lg transition-colors">
            <div className="relative w-24 h-14 rounded-md overflow-hidden bg-surface-elevated flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://img.youtube.com/vi/${trailer.key}/mqdefault.jpg`} className="w-full h-full object-cover opacity-60" alt="Trailer" />
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="text-foreground drop-shadow-lg" size={28} strokeWidth={1.5} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Watch trailer</span>
              <span className="text-xs text-foreground-muted">01:00</span>
            </div>
          </div>
        )}
        
        <hr className="border-border my-4" />

        {/* Air info */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-foreground-muted font-medium">
              <Clock size={16} />
              <span>Weekends | 9:45 pm</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground-muted font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>{runtime} min</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-muted font-medium">
            <Users size={16} />
            <span>6.21K added this show</span>
          </div>
        </div>
      </section>

      {/* Cast section */}
      {show.credits?.cast && show.credits.cast.length > 0 && (
        <section className="flex flex-col gap-3 border-b border-border pb-6">
          <h2 className="text-lg font-bold text-foreground">Cast</h2>
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 snap-x hide-scrollbar">
            {show.credits.cast.slice(0, 15).map(person => (
              <div key={person.id} className="relative flex flex-col w-28 h-40 rounded-lg overflow-hidden shrink-0 snap-start bg-surface-elevated">
                {person.profile_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} className="absolute inset-0 w-full h-full object-cover" alt={person.name} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users size={32} className="text-foreground-muted" />
                  </div>
                )}
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col">
                  <span className="text-xs font-bold text-foreground line-clamp-1">{person.name}</span>
                  <span className="text-[9px] font-bold text-foreground-muted uppercase line-clamp-1">{person.character}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Where to watch section */}
      {show.networks && show.networks.length > 0 && (
        <section className="flex flex-col gap-3 border-b border-border pb-6">
          <h2 className="text-lg font-bold text-foreground">Where to watch</h2>
          <div className="flex flex-wrap gap-2">
            {show.networks.map(network => (
              <div key={network.id} className="bg-surface-elevated border border-gray-700 rounded-md px-3 py-1.5 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">{network.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4 pb-6">
        <div className="flex justify-between items-end">
          <h2 className="text-lg font-bold text-foreground">Community ratings</h2>
          <span className="text-sm text-foreground-muted">Season 1</span>
        </div>
        
        {/* Mock Rating Graph */}
        <div className="h-24 border-b border-gray-700 relative flex items-end">
           <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-foreground-muted pb-1 pr-1">
             <div className="border-t border-gray-800 w-full relative"><span className="absolute -top-1.5 -left-3">5</span></div>
             <div className="border-t border-gray-800 w-full relative"><span className="absolute -top-1.5 -left-3">4</span></div>
             <div className="border-t border-gray-800 w-full relative"><span className="absolute -top-1.5 -left-3">3</span></div>
           </div>
           
           <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
             <polyline points="20,10 100,10 200,90 300,90" fill="none" stroke="#555" strokeWidth="2" />
             <circle cx="20" cy="10" r="4" fill="#34D399" />
             <circle cx="100" cy="10" r="4" fill="#666" />
           </svg>
        </div>
      </section>

      <Link href={`/show/${show.id}/comments`} className="block -mx-4">
        <div className="px-4 py-6 mb-20 flex items-center justify-between border-t border-b border-border hover:bg-white/5 transition-colors cursor-pointer">
          <h3 className="text-foreground font-bold text-lg">Comments</h3>
          <div className="flex items-center gap-1 text-foreground">
            <span>{commentsCount}</span>
            <ChevronDown size={16} className="-rotate-90" />
          </div>
        </div>
      </Link>

    </div>
  )
}
