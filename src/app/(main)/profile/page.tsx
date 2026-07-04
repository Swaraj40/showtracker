export const dynamic = "force-dynamic"

import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/(auth)/actions'
import { getShowDetails } from '@/lib/tmdb'
import { ShowCard } from '@/components/ShowCard'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: showsData } = await supabase
    .from('user_shows')
    .select('show_id, status')
    .eq('user_id', user.id)
    .neq('status', 'dropped')

  const { count: episodesCount } = await supabase
    .from('user_episodes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const shows = []
  if (showsData && showsData.length > 0) {
    const promises = showsData.map(s => getShowDetails(s.show_id))
    const results = await Promise.allSettled(promises)
    for (const res of results) {
      if (res.status === 'fulfilled') shows.push(res.value)
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Profile</h1>
          <p className="text-gray-400">{user.email}</p>
        </div>
        <form action={logout}>
          <button className="bg-red-600/20 text-red-500 hover:bg-red-600/40 px-6 py-2 rounded-xl transition-colors font-semibold">
            Sign Out
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-6 rounded-2xl flex flex-col gap-2">
          <span className="text-gray-400">Total Episodes</span>
          <span className="text-4xl font-black">{episodesCount || 0}</span>
        </div>
        <div className="bg-gray-900 p-6 rounded-2xl flex flex-col gap-2">
          <span className="text-gray-400">Tracked Shows</span>
          <span className="text-4xl font-black">{shows.length}</span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">Your Shows</h2>
        {shows.length === 0 ? (
          <p className="text-gray-500">You are not tracking any shows yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {shows.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
