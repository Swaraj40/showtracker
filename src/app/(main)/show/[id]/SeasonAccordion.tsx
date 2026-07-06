'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react'
import { EpisodeItem } from './EpisodeItem'
import { markSeasonWatched, unmarkSeasonWatched } from './actions'
import { useRouter } from 'next/navigation'

export function SeasonAccordion({ 
  showId, 
  season, 
  showPoster,
  watchedEpisodes, 
  isLoggedIn 
}: { 
  showId: number, 
  season: { season_number: number, episode_count: number, name: string, poster_path?: string },
  showPoster: string | null,
  watchedEpisodes: string[],
  isLoggedIn: boolean
}) {
  const [isOpen, setIsOpen] = useState(season.season_number === 1) // Default open season 1
  const [isMarking, setIsMarking] = useState(false)
  const [showModal, setShowModal] = useState<'mark' | 'unmark' | null>(null)
  const router = useRouter()
  
  // Calculate how many episodes in this season are watched
  const watchedInSeason = watchedEpisodes.filter(id => id.startsWith(`${season.season_number}-`)).length
  const isFullyWatched = watchedInSeason === season.episode_count

  const handleCircleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLoggedIn) {
      alert("Please login to track your watched episodes.")
      return
    }
    
    if (isFullyWatched) {
      setShowModal('unmark')
    } else {
      setShowModal('mark')
    }
  }

  const confirmAction = async () => {
    setIsMarking(true)
    setShowModal(null)
    try {
      if (isFullyWatched) {
        await unmarkSeasonWatched(showId, season.season_number)
      } else {
        await markSeasonWatched(showId, season.season_number, season.episode_count)
      }
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Failed to update episodes.")
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <>
      <div className="flex flex-col mb-1 border-b border-border">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between py-4 px-4 w-full text-left focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-foreground">{season.name}</span>
            {isOpen ? <ChevronUp size={20} className="text-foreground-muted" /> : <ChevronDown size={20} className="text-foreground-muted" />}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-foreground-muted">{watchedInSeason}/{season.episode_count}</span>
            <div 
              onClick={handleCircleClick}
              className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${isFullyWatched ? 'bg-white border-white text-black' : 'border-gray-500 text-transparent hover:border-gray-300'}`}
            >
              {isMarking ? <Loader2 size={14} className="animate-spin text-foreground-muted" /> : <Check size={14} strokeWidth={4} />}
            </div>
          </div>
        </button>

        {isOpen && (
          <div className="flex flex-col bg-background">
            <EpisodeItem 
              showId={showId} 
              seasonNumber={season.season_number} 
              episodeCount={season.episode_count}
              showPoster={showPoster}
              seasonPoster={season.poster_path || null}
              watchedEpisodes={watchedEpisodes}
              isLoggedIn={isLoggedIn}
            />
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-[#1C1C1E] rounded-xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl border border-[#2C2C2E]">
            <div className="p-6 text-center border-b border-[#2C2C2E]">
              <h3 className="text-foreground font-bold text-[17px] mb-2">
                {showModal === 'mark' ? 'Mark Season Watched' : 'Unmark Season'}
              </h3>
              <p className="text-foreground-muted text-[13px] font-medium leading-tight">
                {showModal === 'mark' 
                  ? 'Are you sure you want to mark all episodes watched?' 
                  : 'Are you sure you want to mark all episodes as not watched?'}
              </p>
            </div>
            <div className="flex">
              <button 
                onClick={() => setShowModal(null)}
                className="flex-1 py-3 text-center text-[17px] text-[#0A84FF] border-r border-[#2C2C2E] hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAction}
                className="flex-1 py-3 text-center text-[17px] font-bold text-[#FF453A] hover:bg-white/5 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
