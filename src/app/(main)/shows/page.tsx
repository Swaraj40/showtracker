import { createClient } from '@/utils/supabase/server'
import { getShowDetails, getSeasonDetails } from '@/lib/tmdb'
import { NextEpisodeRow } from './NextEpisodeRow'
import { redirect } from 'next/navigation'

export const dynamic = "force-dynamic"

export default async function ShowsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const p = await searchParams;
  const tab = p.tab || 'watchlist'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's tracked shows
  const { data: userShows } = await supabase
    .from('user_shows')
    .select('show_id, status')
    .eq('user_id', user.id)

  if (!userShows || userShows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Your Watchlist is empty</h1>
        <p className="text-gray-400">Start tracking shows to see them here.</p>
        <a href="/" className="bg-[#FFD54F] text-black px-6 py-2 rounded-full font-bold mt-4">
          Discover Shows
        </a>
      </div>
    )
  }

  // Get user's watched episodes
  const { data: watchedEpisodes } = await supabase
    .from('user_episodes')
    .select('show_id, season_number, episode_number')
    .eq('user_id', user.id)

  const watchedSet = new Set((watchedEpisodes || []).map(e => `${e.show_id}-${e.season_number}-${e.episode_number}`))

  // Calculate Next Episode for each show
  const showsWithNextEpisode = await Promise.all(
    userShows.map(async (tracked) => {
      try {
        const details = await getShowDetails(tracked.show_id)
        
        let nextSeason = -1
        let nextEp = -1

        // Find the earliest unwatched episode
        for (const season of details.seasons || []) {
          if (season.season_number === 0) continue // skip specials

          for (let ep = 1; ep <= season.episode_count; ep++) {
            if (!watchedSet.has(`${details.id}-${season.season_number}-${ep}`)) {
              nextSeason = season.season_number
              nextEp = ep
              break
            }
          }
          if (nextSeason !== -1) break
        }

        if (nextSeason === -1) {
          return null // Show is completed
        }

        // Fetch episode name (optional, but nice)
        let epName = ''
        try {
          const seasonDetails = await getSeasonDetails(details.id, nextSeason)
          const targetEp = seasonDetails.find(e => e.episode_number === nextEp)
          if (targetEp) epName = targetEp.name
        } catch (e) {
          // ignore error if season details fail
        }

        return {
          show: details,
          nextEpisode: {
            season: nextSeason,
            episode: nextEp,
            name: epName
          }
        }
      } catch (e) {
        return null
      }
    })
  )

  const activeShows = showsWithNextEpisode.filter(Boolean) as any[]

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Nav Tabs */}
      <div className="flex items-center w-full border-b border-[#1E1E1E]">
        <a 
          href="/shows?tab=watchlist" 
          className={`flex-1 text-center py-4 text-xs font-bold tracking-widest ${tab === 'watchlist' ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}
        >
          WATCH LIST
        </a>
        <a 
          href="/shows?tab=upcoming" 
          className={`flex-1 text-center py-4 text-xs font-bold tracking-widest ${tab === 'upcoming' ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}
        >
          UPCOMING
        </a>
      </div>

      <div className="flex justify-between items-center p-4">
        <div className="bg-[#1E1E1E] text-gray-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
          Watch Next
        </div>
        <button className="text-[#FFD54F]">
          {/* Mock grid toggle icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        </button>
      </div>

      <div className="flex flex-col px-2">
        {activeShows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">You are completely up to date!</div>
        ) : (
          activeShows.map(({ show, nextEpisode }) => (
            <NextEpisodeRow key={show.id} show={show} nextEpisode={nextEpisode} />
          ))
        )}
      </div>
    </div>
  )
}
