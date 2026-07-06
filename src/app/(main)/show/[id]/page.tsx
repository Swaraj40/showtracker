import { getShowDetails } from '@/lib/tmdb'
import { createClient } from '@/utils/supabase/server'
import { TrackButton } from './TrackButton'
import { FavoriteButton } from './FavoriteButton'
import { AddToListButtonClient } from './AddToListButtonClient'
import { AboutTab } from './AboutTab'
import { EpisodesTab } from './EpisodesTab'
import { ChevronDown } from 'lucide-react'
import { ShowMenuClient } from './ShowMenuClient'

export const dynamic = "force-dynamic"

export default async function ShowPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ tab?: string }> }) {
  const p = await params;
  const sp = await searchParams;
  const tab = sp.tab || 'about'
  
  const show = await getShowDetails(p.id)
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentStatus = null
  let isFavorite = false
  let watchedEpisodes = new Set<string>()

  if (user) {
    const { data: showData } = await supabase
      .from('user_shows')
      .select('status, is_favorite')
      .eq('show_id', show.id)
      .eq('user_id', user.id)
      .single()
    
    if (showData) {
      currentStatus = showData.status
      isFavorite = showData.is_favorite
    }

    const { data: episodeData } = await supabase
      .from('user_episodes')
      .select('season_number, episode_number')
      .eq('show_id', show.id)
      .eq('user_id', user.id)

    if (episodeData) {
      episodeData.forEach(e => watchedEpisodes.add(`${e.season_number}-${e.episode_number}`))
    }
  }

  const { count: commentsCount } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('media_type', 'show')
    .eq('media_id', show.id)

  const backdropUrl = show.backdrop_path ? (show.backdrop_path.startsWith('http') ? show.backdrop_path : `https://image.tmdb.org/t/p/original${show.backdrop_path}`) : ''
  const coverPath = show.backdrop_path ? (show.backdrop_path.startsWith('http') ? show.backdrop_path : `https://image.tmdb.org/t/p/w780${show.backdrop_path}`) : undefined

  return (
    <div className="flex flex-col pb-12 w-full bg-background min-h-screen">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-4 py-4 pointer-events-none">
        <a href="/" className="pointer-events-auto text-white">
          <ChevronDown size={28} className="rotate-90" />
        </a>
        <h1 className="text-white font-bold truncate px-4 drop-shadow-md">{show.name}</h1>
        <ShowMenuClient 
          showId={show.id} 
          showName={show.name} 
          initialStatus={currentStatus} 
          initialIsFavorite={isFavorite} 
          user={user} 
          coverPath={coverPath} 
        />
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
          <div className="absolute inset-0 bg-surface-elevated" />
        )}
      </div>
      
      {/* Track Button overlaid slightly on the hero */}
      <div className="px-4 -mt-6 relative z-10 flex justify-center mb-4 gap-3">
        {user ? (
          <>
            <TrackButton showId={show.id} currentStatus={currentStatus} />
            <FavoriteButton showId={show.id} isFavorite={isFavorite} />
            <AddToListButtonClient itemId={show.id} mediaType="tv" coverPath={coverPath} />
          </>
        ) : (
          <a href="/login" className="w-full max-w-sm flex items-center justify-center gap-2 py-3 bg-[#FFD54F] text-black rounded-full font-bold shadow-lg">
            Log in to track this show
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex w-full border-b border-border sticky top-0 bg-background z-40">
        <a 
          href={`/show/${show.id}?tab=about`}
          className={`flex-1 text-center py-4 text-[11px] font-bold tracking-[0.2em] transition-colors ${tab === 'about' ? 'text-foreground border-b-2 border-[#FFD54F]' : 'text-foreground-muted hover:text-foreground-muted'}`}
        >
          ABOUT
        </a>
        <a 
          href={`/show/${show.id}?tab=episodes`}
          className={`flex-1 text-center py-4 text-[11px] font-bold tracking-[0.2em] transition-colors ${tab === 'episodes' ? 'text-foreground border-b-2 border-[#FFD54F]' : 'text-foreground-muted hover:text-foreground-muted'}`}
        >
          EPISODES
        </a>
      </div>

      {/* Tab Content */}
      <div className="flex-1 w-full bg-background">
        {tab === 'about' ? (
          <AboutTab show={show} commentsCount={commentsCount || 0} />
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
