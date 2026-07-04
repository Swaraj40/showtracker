import { createClient } from '@/utils/supabase/server'
import { getShowDetails } from '@/lib/tmdb'
import { ShowCard } from '@/components/ShowCard'
import { redirect } from 'next/navigation'

export const dynamic = "force-dynamic"

export default async function ShowsPage() {
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

  // Get user's watched episodes counts per show
  const { data: watchedEpisodes } = await supabase
    .from('user_episodes')
    .select('show_id')
    .eq('user_id', user.id)

  const watchedCountByShow = (watchedEpisodes || []).reduce((acc: any, curr) => {
    acc[curr.show_id] = (acc[curr.show_id] || 0) + 1
    return acc
  }, {})

  // Fetch show details from TMDB (can be slow if many shows, but fine for now)
  const showsWithProgress = await Promise.all(
    userShows.map(async (tracked) => {
      try {
        const details = await getShowDetails(tracked.show_id)
        
        // Count total aired episodes (excluding specials season 0)
        let totalEpisodes = 0
        details.seasons?.forEach(s => {
          if (s.season_number > 0) totalEpisodes += s.episode_count
        })

        // On TVMaze fallback, number_of_episodes is 0, so calculate manually
        if (details.number_of_episodes === 0) {
          details.number_of_episodes = totalEpisodes
        }

        const total = details.number_of_episodes || totalEpisodes
        const watched = watchedCountByShow[tracked.show_id] || 0

        return {
          ...details,
          progress: { watched, total },
          trackedStatus: tracked.status
        }
      } catch (e) {
        return null
      }
    })
  )

  const validShows = showsWithProgress.filter(Boolean) as any[]

  // Group shows
  const continueWatching = validShows.filter(s => s.progress.watched > 0 && s.progress.watched < s.progress.total)
  const upToDate = validShows.filter(s => s.progress.watched > 0 && s.progress.watched >= s.progress.total)
  const notStarted = validShows.filter(s => s.progress.watched === 0)

  return (
    <div className="flex flex-col gap-8 pt-4 px-2">
      <h1 className="text-2xl font-bold">My Shows</h1>
      
      {continueWatching.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-300 border-b border-[#1E1E1E] pb-2">Continue Watching</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {continueWatching.map(show => <ShowCard key={show.id} show={show} progress={show.progress} />)}
          </div>
        </section>
      )}

      {notStarted.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-300 border-b border-[#1E1E1E] pb-2">Not Started</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {notStarted.map(show => <ShowCard key={show.id} show={show} progress={show.progress} />)}
          </div>
        </section>
      )}

      {upToDate.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-300 border-b border-[#1E1E1E] pb-2">Up to Date</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {upToDate.map(show => <ShowCard key={show.id} show={show} progress={show.progress} />)}
          </div>
        </section>
      )}
    </div>
  )
}
