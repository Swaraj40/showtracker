import { createClient } from '@/utils/supabase/server'
import { getShowDetails } from '@/lib/tmdb'
import { logout } from '@/app/(auth)/actions'

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex flex-col gap-8 pt-8 px-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        <a href="/login" className="w-full flex items-center justify-center gap-2 py-3 bg-[#FFD54F] text-black rounded-xl font-bold">
          Log in
        </a>
      </div>
    )
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch watched episodes
  const { data: episodes } = await supabase
    .from('user_episodes')
    .select('show_id')
    .eq('user_id', user.id)

  const episodeCount = episodes?.length || 0
  
  // Compute TV Time (defaulting to 45 mins per episode to prevent massive TMDB API rate limiting)
  let totalTvMinutes = episodeCount * 45

  // Format TV Time
  const tvMonths = Math.floor(totalTvMinutes / (60 * 24 * 30))
  const tvDays = Math.floor((totalTvMinutes % (60 * 24 * 30)) / (60 * 24))
  const tvHours = Math.floor((totalTvMinutes % (60 * 24)) / 60)

  // Fetch watched movies
  // Note: Assuming user_movies exists after migration
  let movieCount = 0
  let totalMovieMinutes = 0
  try {
    const { data: movies } = await supabase
      .from('user_movies')
      .select('movie_id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
    
    movieCount = movies?.length || 0
    // We would fetch movie runtimes here, but defaulting to 120 mins for now to avoid TMDB spam
    totalMovieMinutes = movieCount * 120
  } catch (e) {
    // Table might not exist if migration hasn't been run
  }

  const mMonths = Math.floor(totalMovieMinutes / (60 * 24 * 30))
  const mDays = Math.floor((totalMovieMinutes % (60 * 24 * 30)) / (60 * 24))
  const mHours = Math.floor((totalMovieMinutes % (60 * 24)) / 60)

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Header with Background */}
      <div className="relative w-full h-48 bg-[#111111]">
        {/* Placeholder for banner */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        <div className="absolute bottom-4 left-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
            alt="Avatar" 
            className="w-16 h-16 rounded-full border-2 border-white object-cover bg-gray-800"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">{profile?.display_name || user.email?.split('@')[0]}</span>
            <button className="text-xs font-bold border border-gray-400 rounded-full px-3 py-1 mt-1 w-fit uppercase text-gray-300">
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Social Stats */}
      <div className="flex items-center w-full border-b border-t border-[#1E1E1E] py-4 bg-black">
        <div className="flex-1 flex flex-col items-center justify-center border-r border-[#1E1E1E]">
          <span className="text-lg font-bold">1</span>
          <span className="text-xs text-gray-400">following</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center border-r border-[#1E1E1E]">
          <span className="text-lg font-bold">0</span>
          <span className="text-xs text-gray-400">followers</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-lg font-bold">17</span>
          <span className="text-xs text-gray-400">comments</span>
        </div>
      </div>

      <div className="px-4 py-6 flex flex-col gap-6">
        {/* Stats Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Stats</h2>
            <span className="text-gray-400">&gt;</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            {/* TV Time */}
            <div className="border border-[#2A2A2A] rounded-md bg-black flex flex-col">
              <div className="flex items-center justify-center gap-2 py-2 border-b border-[#2A2A2A]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
                <span className="text-sm font-bold">TV time</span>
              </div>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{tvMonths}</span>
                  <span className="text-[10px] text-gray-400">MONTHS</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{tvDays}</span>
                  <span className="text-[10px] text-gray-400">DAYS</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{tvHours}</span>
                  <span className="text-[10px] text-gray-400">HOURS</span>
                </div>
              </div>
            </div>

            {/* Episodes watched */}
            <div className="border border-[#2A2A2A] rounded-md bg-black flex flex-col">
              <div className="flex items-center justify-center gap-2 py-2 border-b border-[#2A2A2A]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span className="text-sm font-bold">Episodes watched</span>
              </div>
              <div className="flex items-center justify-center py-4 h-full">
                <span className="text-2xl font-bold">{episodeCount.toLocaleString()}</span>
              </div>
            </div>

            {/* Movie Time */}
            <div className="border border-[#2A2A2A] rounded-md bg-black flex flex-col">
              <div className="flex items-center justify-center gap-2 py-2 border-b border-[#2A2A2A]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
                <span className="text-sm font-bold">Movie time</span>
              </div>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{mMonths}</span>
                  <span className="text-[10px] text-gray-400">MONTHS</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{mDays}</span>
                  <span className="text-[10px] text-gray-400">DAYS</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{mHours}</span>
                  <span className="text-[10px] text-gray-400">HOURS</span>
                </div>
              </div>
            </div>

            {/* Movies watched */}
            <div className="border border-[#2A2A2A] rounded-md bg-black flex flex-col">
              <div className="flex items-center justify-center gap-2 py-2 border-b border-[#2A2A2A]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
                <span className="text-sm font-bold">Movies watched</span>
              </div>
              <div className="flex items-center justify-center py-4 h-full">
                <span className="text-2xl font-bold">{movieCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 mt-4">
          <form action={logout}>
            <button className="w-full py-3 bg-red-900/20 text-red-400 font-bold rounded-full border border-red-900/50">
              Log Out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
