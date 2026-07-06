import { createClient } from '@/utils/supabase/server'
import { getShowDetails, getMovieDetails } from '@/lib/tmdb'
import { ProfileHeaderClient } from '../ProfileHeaderClient'
import { ProfilePosterCarousel, ProfilePoster } from '../ProfilePosterCarousel'
import { ProfileListCarousel, CustomList } from '../ProfileListCarousel'
import { ProfileStatsCarousel } from '../ProfileStatsCarousel'
import { Heart } from 'lucide-react'
import { notFound } from 'next/navigation'

export const dynamic = "force-dynamic"

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const supabase = await createClient()

  // Fetch the target user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', p.id)
    .single()

  if (!profile) {
    notFound()
  }

  // Check if it's the currently logged-in user
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === p.id

  // Fetch all user shows
  const { data: userShows } = await supabase
    .from('user_shows')
    .select('show_id, status, is_favorite')
    .eq('user_id', p.id)

  // Fetch all user movies
  let userMovies: any[] = []
  try {
    const { data: movies } = await supabase
      .from('user_movies')
      .select('movie_id, status, is_favorite')
      .eq('user_id', p.id)
    if (movies) userMovies = movies
  } catch(e) {}

  // Fetch user lists
  let userListsData: any[] = []
  try {
    const { data: lists } = await supabase
      .from('user_lists')
      .select('*')
      .eq('user_id', p.id)
      .order('created_at', { ascending: false })
    if (lists) userListsData = lists
  } catch(e) {}

  // We need to hydrate IDs with posters from TMDB
  const fetchShowPoster = async (id: number): Promise<ProfilePoster | null> => {
    try {
      const details = await getShowDetails(id)
      const posterUrl = details.poster_path 
        ? (details.poster_path.startsWith('http') ? details.poster_path : `https://image.tmdb.org/t/p/w342${details.poster_path}`)
        : '/placeholder.jpg'
      return { id, title: details.name, poster_url: posterUrl, url: `/show/${id}` }
    } catch (e) {
      return null
    }
  }

  const fetchMoviePoster = async (id: number): Promise<ProfilePoster | null> => {
    try {
      const details = await getMovieDetails(id)
      const posterUrl = details.poster_path 
        ? (details.poster_path.startsWith('http') ? details.poster_path : `https://image.tmdb.org/t/p/w342${details.poster_path}`)
        : '/placeholder.jpg'
      return { id, title: details.title, poster_url: posterUrl, url: `/movies/${id}` }
    } catch (e) {
      return null
    }
  }

  // Filter shows & movies
  const completedShowIds = (userShows || []).filter(s => s.status === 'completed' || s.status === 'watching').map(s => s.show_id)
  const favoriteShowIds = (userShows || []).filter(s => s.is_favorite === true).map(s => s.show_id)
  const completedMovieIds = userMovies.filter(m => m.status === 'completed').map(m => m.movie_id)
  const favoriteMovieIds = userMovies.filter(m => m.is_favorite === true).map(m => m.movie_id)

  // Hydrate Data in Parallel (Limit to 15 per row to avoid massive API spikes)
  const [
    completedShows,
    favoriteShows,
    completedMovies,
    favoriteMovies
  ] = await Promise.all([
    Promise.all(completedShowIds.slice(0, 15).map(fetchShowPoster)),
    Promise.all(favoriteShowIds.slice(0, 15).map(fetchShowPoster)),
    Promise.all(completedMovieIds.slice(0, 15).map(fetchMoviePoster)),
    Promise.all(favoriteMovieIds.slice(0, 15).map(fetchMoviePoster))
  ])

  // Clean nulls
  const cShows = completedShows.filter(Boolean) as ProfilePoster[]
  const fShows = favoriteShows.filter(Boolean) as ProfilePoster[]
  const cMovies = completedMovies.filter(Boolean) as ProfilePoster[]
  const fMovies = favoriteMovies.filter(Boolean) as ProfilePoster[]

  // Format custom lists
  const mappedLists: CustomList[] = userListsData.map(list => ({
    id: list.id,
    name: list.name,
    cover_url: list.cover_path || 'https://images.unsplash.com/photo-1604928141064-207cea6f571f?q=80&w=600&auto=format&fit=crop'
  }))

  // Stats Logic
  let episodeCount = 0
  let backdropUrl = ''
  try {
    const { data: episodes } = await supabase.from('user_episodes').select('show_id, watched_at').eq('user_id', p.id).order('watched_at', { ascending: false })
    episodeCount = episodes?.length || 0
    if (episodes && episodes.length > 0) {
      const showDetails = await getShowDetails(episodes[0].show_id.toString())
      if (showDetails?.backdrop_path) {
        backdropUrl = showDetails.backdrop_path.startsWith('http') ? showDetails.backdrop_path : `https://image.tmdb.org/t/p/w1280${showDetails.backdrop_path}`
      }
    }
  } catch(e) {}

  // Social Stats
  let followingCount = 0; let followersCount = 0; let commentsCount = 0;
  try {
    const [{ count: f1 }, { count: f2 }, { count: c1 }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', p.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', p.id),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', p.id)
    ])
    followingCount = f1 || 0; followersCount = f2 || 0; commentsCount = c1 || 0;
  } catch (e) {}

  const dummyEmail = profile.display_name ? `${profile.display_name}@user` : 'user@domain.com'

  return (
    <div className="flex flex-col w-full pb-16 bg-background min-h-screen overflow-x-hidden">
      <ProfileHeaderClient 
        profile={profile} 
        userEmail={dummyEmail} 
        backdropUrl={backdropUrl}
        isOwner={isOwner}
      />

      {/* Social Stats */}
      <div className="flex items-center w-full border-b border-border py-4 bg-background">
        <div className="flex-1 flex flex-col items-center justify-center border-r border-border">
          <span className="text-lg font-bold text-foreground">{followingCount}</span>
          <span className="text-[13px] text-foreground-muted">following</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center border-r border-border">
          <span className="text-lg font-bold text-foreground">{followersCount}</span>
          <span className="text-[13px] text-foreground-muted">followers</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-foreground">{commentsCount}</span>
          <span className="text-[13px] text-foreground-muted">comments</span>
        </div>
      </div>

      <div className="flex flex-col mt-4">
        
        {/* Watch Stats Carousel */}
        <ProfileStatsCarousel episodeCount={episodeCount} movieCount={completedMovieIds.length} />
        
        {/* Lists Section */}
        {mappedLists.length > 0 && <ProfileListCarousel title="Lists" lists={mappedLists} />}

        {/* Completed Shows Section */}
        {cShows.length > 0 && <ProfilePosterCarousel title="Shows" items={cShows} />}

        {/* Favorite Shows Section */}
        {fShows.length > 0 && (
          <ProfilePosterCarousel 
            title="Favorite shows" 
            icon={<Heart className="text-red-500 fill-red-500" size={24} />} 
            items={fShows} 
          />
        )}

        {/* Completed Movies Section */}
        {cMovies.length > 0 && <ProfilePosterCarousel title="Movies" items={cMovies} />}

        {/* Favorite Movies Section */}
        {fMovies.length > 0 && (
          <ProfilePosterCarousel 
            title="Favorite movies" 
            icon={<Heart className="text-red-500 fill-red-500" size={24} />} 
            items={fMovies} 
          />
        )}

      </div>
    </div>
  )
}
