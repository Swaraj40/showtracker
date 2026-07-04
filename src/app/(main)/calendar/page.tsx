export const dynamic = "force-dynamic"

import { createClient } from '@/utils/supabase/server'
import { getShowDetails, TMDBShowDetails } from '@/lib/tmdb'
import { ShowCard } from '@/components/ShowCard'
import { redirect } from 'next/navigation'

type UpcomingShow = TMDBShowDetails & { next_air_date: Date }

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: showsData } = await supabase
    .from('user_shows')
    .select('show_id')
    .eq('user_id', user.id)
    .in('status', ['watching', 'watchlist'])

  let upcoming: UpcomingShow[] = []

  if (showsData && showsData.length > 0) {
    const promises = showsData.map(s => getShowDetails(s.show_id))
    const results = await Promise.allSettled(promises)
    
    for (const res of results) {
      if (res.status === 'fulfilled') {
        const show = res.value
        // @ts-ignore
        if (show.next_episode_to_air) {
          // @ts-ignore
          const airDate = new Date(show.next_episode_to_air.air_date)
          upcoming.push({ ...show, next_air_date: airDate })
        }
      }
    }
  }

  upcoming.sort((a, b) => a.next_air_date.getTime() - b.next_air_date.getTime())

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Upcoming Episodes</h1>
      
      {upcoming.length === 0 ? (
        <p className="text-gray-500">No upcoming episodes for the shows you track.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {upcoming.map((show) => (
            <div key={show.id} className="flex flex-col gap-2">
              <ShowCard show={show} />
              <div className="bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded-md text-center">
                Airs: {show.next_air_date.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
