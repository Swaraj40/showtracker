import { TMDBShowDetails } from '@/lib/tmdb'
import { SeasonAccordion } from './SeasonAccordion'

export function EpisodesTab({ 
  show, 
  watchedEpisodes, 
  isLoggedIn 
}: { 
  show: TMDBShowDetails, 
  watchedEpisodes: string[],
  isLoggedIn: boolean
}) {

  // For the 'Continue tracking' section, ideally we'd find the next unwatched episode
  // But since we fetch episodes per-season client-side for performance, 
  // we'll focus on the 'All episodes' accordion view for now.
  
  // Filter out specials (season 0) to match TV Time typical display
  const standardSeasons = show.seasons.filter(s => s.season_number > 0)

  return (
    <div className="flex flex-col pb-6">
      
      {/* Mock 'Continue tracking' header */}
      <div className="px-4 py-4 border-b border-[#2A2A2A] bg-[#121212]">
        <h2 className="text-sm font-bold text-white mb-3">Continue tracking</h2>
        <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar">
           {/* We would map the user's next unwatched episodes here. For UI purposes, we add placeholders */}
           <div className="flex items-center gap-3 w-64 shrink-0 snap-start bg-[#1E1E1E] p-2 rounded-lg">
             <div className="w-16 h-16 bg-gray-800 rounded-md shrink-0"></div>
             <div className="flex flex-col flex-1">
                <span className="font-bold text-white">Next Up</span>
                <span className="text-xs text-gray-400">Expand a season below</span>
             </div>
           </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 bg-[#121212]">
        <h2 className="text-sm font-bold text-white">All episodes</h2>
      </div>

      <div className="flex flex-col">
        {standardSeasons.map((season) => (
          <SeasonAccordion 
            key={season.id}
            showId={show.id}
            season={season}
            watchedEpisodes={watchedEpisodes}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>

    </div>
  )
}
