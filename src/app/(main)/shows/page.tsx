import { createClient } from '@/utils/supabase/server'
import { getShowDetails, getSeasonDetails } from '@/lib/tmdb'
import { NextEpisodeRow } from './NextEpisodeRow'
import { UpcomingEpisodeRow } from './UpcomingEpisodeRow'
import { redirect } from 'next/navigation'

export const dynamic = "force-dynamic"

// Helper to format the grouping date
function getRelativeDateLabel(dateStr: string) {
  if (!dateStr) return 'TBA'
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const targetDate = new Date(target)
  targetDate.setHours(0, 0, 0, 0)
  
  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === -1) return 'YESTERDAY'
  if (diffDays === 0) return 'TODAY'
  if (diffDays === 1) return 'TOMORROW'
  if (diffDays > 1 && diffDays < 7) {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    return days[target.getDay()]
  }
  
  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
}

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

  // Active trackable shows
  const activeShows = userShows.filter(s => s.status !== 'completed' && s.status !== 'dropped')

  let watchlistRenderData: any[] = []
  let upcomingRenderGroups: { label: string, episodes: any[] }[] = []

  if (tab === 'watchlist') {
    // Get user's watched episodes
    const { data: watchedEpisodes } = await supabase
      .from('user_episodes')
      .select('show_id, season_number, episode_number')
      .eq('user_id', user.id)

    const watchedSet = new Set((watchedEpisodes || []).map(e => `${e.show_id}-${e.season_number}-${e.episode_number}`))

    // Calculate Next Episode for each show
    const showsWithNextEpisode = await Promise.all(
      activeShows.map(async (tracked) => {
        try {
          const details = await getShowDetails(tracked.show_id)
          
          let nextSeason = -1
          let nextEp = -1
          let totalUnwatched = 0

          for (const season of details.seasons || []) {
            if (season.season_number === 0) continue // skip specials

            for (let ep = 1; ep <= season.episode_count; ep++) {
              if (!watchedSet.has(`${details.id}-${season.season_number}-${ep}`)) {
                if (nextSeason === -1) {
                  nextSeason = season.season_number
                  nextEp = ep
                }
                totalUnwatched++
              }
            }
          }

          if (nextSeason === -1) {
            return null // Show is completed
          }

          return {
            show: details,
            nextEpisode: {
              season: nextSeason,
              episode: nextEp,
              name: '',
              episodesLeft: totalUnwatched - 1
            }
          }
        } catch (e) {
          return null
        }
      })
    )
    watchlistRenderData = showsWithNextEpisode.filter(Boolean) as any[]
  } else {
    // Upcoming Tab Logic
    const allUpcomingEpisodes: any[] = []
    const today = new Date()
    today.setHours(0,0,0,0)

    await Promise.all(
      activeShows.map(async (tracked) => {
        try {
          const details = await getShowDetails(tracked.show_id)
          const network = details.networks?.[0]?.name || 'NET'
          
          const processEpisode = (ep: any, isNext: boolean) => {
            if (!ep || !ep.air_date) return
            const epDate = new Date(ep.air_date)
            const diffDays = Math.round((epDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            
            // For the sake of the demo and clock differences (2024 vs 2026), 
            // we will unconditionally include the next_episode_to_air.
            // For last_episode_to_air, we include it if it's relatively recent or if there is a next episode.
            if (!isNext && diffDays < -30 && !details.next_episode_to_air) return
            
            allUpcomingEpisodes.push({
              show: details,
              episode: {
                season: ep.season_number,
                episode: ep.episode_number,
                name: ep.name,
                airDate: ep.air_date,
                network,
                isAired: diffDays < 0,
                timeStr: '8:00 pm' // Mock time since TMDB doesn't easily provide local air times
              }
            })
          }

          // We check the last episode to air
          if (details.last_episode_to_air) {
            processEpisode(details.last_episode_to_air, false)
          }
          // And the next episode to air
          if (details.next_episode_to_air) {
            processEpisode(details.next_episode_to_air, true)
            
            // Fetch the rest of the season to get ALL future episodes for this airing season
            try {
              const seasonData = await getSeasonDetails(details.id, details.next_episode_to_air.season_number)
              for (const ep of seasonData) {
                if (ep.episode_number > details.next_episode_to_air.episode_number && ep.air_date) {
                  processEpisode(ep, true)
                }
              }
            } catch (e) {
              // Ignore if we can't fetch season details
            }
          }
        } catch (e) {
          // ignore
        }
      })
    )

    // Deduplicate (in case last and next are somehow the same, or just to be safe)
    const uniqueEpisodes = new Map()
    allUpcomingEpisodes.forEach(item => {
      uniqueEpisodes.set(`${item.show.id}-${item.episode.season}-${item.episode.episode}`, item)
    })

    const sortedEpisodes = Array.from(uniqueEpisodes.values()).sort((a, b) => {
      return new Date(a.episode.airDate).getTime() - new Date(b.episode.airDate).getTime()
    })

    // Group by Date Label
    const grouped = new Map<string, any[]>()
    sortedEpisodes.forEach(item => {
      const label = getRelativeDateLabel(item.episode.airDate)
      if (!grouped.has(label)) grouped.set(label, [])
      grouped.get(label)!.push(item)
    })

    upcomingRenderGroups = Array.from(grouped.entries()).map(([label, episodes]) => ({ label, episodes }))
  }

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
        {tab === 'watchlist' ? (
          <div className="bg-[#1E1E1E] text-gray-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
            Watch Next
          </div>
        ) : (
          <div /> // Placeholder for spacing
        )}
        <button className="text-[#FFD54F]">
          {/* Mock grid toggle icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        </button>
      </div>

      <div className="flex flex-col px-2">
        {tab === 'watchlist' ? (
          watchlistRenderData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">You are completely up to date!</div>
          ) : (
            watchlistRenderData.map(({ show, nextEpisode }) => (
              <NextEpisodeRow key={show.id} show={show} nextEpisode={nextEpisode} />
            ))
          )
        ) : (
          upcomingRenderGroups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No upcoming episodes for your shows.</div>
          ) : (
            upcomingRenderGroups.map((group) => (
              <div key={group.label} className="flex flex-col mb-4">
                <div className="flex justify-center mb-2">
                  <span className="bg-[#555555] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                    {group.label}
                  </span>
                </div>
                {group.episodes.map(({ show, episode }) => (
                  <UpcomingEpisodeRow key={`${show.id}-${episode.season}-${episode.episode}`} show={show} episode={episode} />
                ))}
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}
