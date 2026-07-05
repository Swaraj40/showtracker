import { getShowDetails } from '@/lib/tmdb'
import { createClient } from '@/utils/supabase/server'
import { TrackButton } from './TrackButton'
import { AboutTab } from './AboutTab'
import { EpisodesTab } from './EpisodesTab'
import { ChevronDown, MoreHorizontal } from 'lucide-react'

export const dynamic = "force-dynamic"

export default async function ShowPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ tab?: string }> }) {
  const p = await params;
  const sp = await searchParams;
  const tab = sp.tab || 'about'
  
  const show = await getShowDetails(p.id)
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentStatus = null
  let watchedEpisodes = new Set<string>()

  if (user) {
    const { data: showData } = await supabase
      .from('user_shows')
      .select('status')
      .eq('show_id', show.id)
      .eq('user_id', user.id)
      .single()
    
    if (showData) currentStatus = showData.status

    const { data: episodeData } = await supabase
      .from('user_episodes')
      .select('season_number, episode_number')
      .eq('show_id', show.id)
      .eq('user_id', user.id)

    if (episodeData) {
      episodeData.forEach(e => watchedEpisodes.add(`${e.season_number}-${e.episode_number}`))
    }
  }

  const backdropUrl = show.backdrop_path ? (show.backdrop_path.startsWith('http') ? show.backdrop_path : `https://image.tmdb.org/t/p/original${show.backdrop_path}`) : ''

  return (
    <div className="flex flex-col pb-12 w-full bg-black min-h-screen">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-4 py-4 pointer-events-none">
        <a href="/" className="pointer-events-auto text-white">
          <ChevronDown size={28} className="rotate-90" />
        </a>
        <h1 className="text-white font-bold truncate px-4 drop-shadow-md">{show.name}</h1>
        <button className="pointer-events-auto text-white">
          <MoreHorizontal size={28} />
        </button>
      </div>

      {/* Hero section */}
      <div className="relative w-full h-[30vh] min-h-[250px] flex flex-col justify-end">
        {backdropUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={backdropUrl} alt={show.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[#1E1E1E]" />
        )}
      </div>
      
      {/* Track Button overlaid slightly on the hero */}
      <div className="px-4 -mt-6 relative z-10 flex justify-center mb-4">
        {user ? (
          <TrackButton showId={show.id} currentStatus={currentStatus} />
        ) : (
          <a href="/login" className="w-full max-w-sm flex items-center justify-center gap-2 py-3 bg-[#FFD54F] text-black rounded-full font-bold shadow-lg">
            Log in to track this show
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex w-full border-b border-[#2A2A2A] sticky top-0 bg-black z-40">
        <a 
          href={`/show/${show.id}?tab=about`}
          className={`flex-1 text-center py-4 text-[11px] font-bold tracking-[0.2em] transition-colors ${tab === 'about' ? 'text-white border-b-2 border-[#FFD54F]' : 'text-gray-500 hover:text-gray-300'}`}
        >
          ABOUT
        </a>
        <a 
          href={`/show/${show.id}?tab=episodes`}
          className={`flex-1 text-center py-4 text-[11px] font-bold tracking-[0.2em] transition-colors ${tab === 'episodes' ? 'text-white border-b-2 border-[#FFD54F]' : 'text-gray-500 hover:text-gray-300'}`}
        >
          EPISODES
        </a>
      </div>

      {/* Tab Content */}
      <div className="flex-1 w-full bg-black">
        {tab === 'about' ? (
          <AboutTab show={show} />
        ) : (
          <EpisodesTab 
            show={show} 
            watchedEpisodes={Array.from(watchedEpisodes)} 
            isLoggedIn={!!user} 
          />
        )}
      </div>
    </div>
  )
}
