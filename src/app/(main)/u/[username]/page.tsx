import { createClient } from '@/utils/supabase/server'
import { getShowDetails, getMovieDetails } from '@/lib/tmdb'
import { ProfileHeaderClient } from '../../profile/ProfileHeaderClient'
import { ProfilePosterCarousel, ProfilePoster } from '../../profile/ProfilePosterCarousel'
import { ProfileListCarousel, CustomList } from '../../profile/ProfileListCarousel'
import { ProfileStatsCarousel } from '../../profile/ProfileStatsCarousel'
import { Heart } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = "force-dynamic"

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const p = await params
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Fetch the public profile by username or id
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.eq.${p.username},id.eq.${p.username}`)
    .single()

  if (!profile || error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
        <p className="text-foreground-muted">The user you are looking for does not exist.</p>
      </div>
    )
  }

  // If viewing own profile, redirect to /profile
  if (currentUser && currentUser.id === profile.id) {
    redirect('/profile')
  }

  const isOwner = false
  const userEmail = '' // Don't expose email publicly

  // Check if current user is following this profile
  let isFollowing = false
  if (currentUser) {
    const { data: followData } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', profile.id)
      .single()
    
    if (followData) isFollowing = true
  }

  // Fetch all user shows
  const { data: userShows } = await supabase
    .from('user_shows')
    .select('show_id, status, is_favorite')
    .eq('user_id', profile.id)

  // Fetch all user movies
  let userMovies: any[] = []
  try {
    const { data: movies } = await supabase
      .from('user_movies')
      .select('movie_id, status, is_favorite')
      .eq('user_id', profile.id)
    if (movies) userMovies = movies
  } catch(e) {}

  // Fetch user lists
  let userListsData: any[] = []
  try {
    const { data: lists } = await supabase
      .from('user_lists')
      .select('*')
      .eq('user_id', profile.id)
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
    Promise.all(favoriteMovieIds.slice(0, 15).map(fetchMoviePoster)),
  ])

  // Filter out nulls
  const validCompletedShows = completedShows.filter((s): s is ProfilePoster => s !== null)
  const validFavoriteShows = favoriteShows.filter((s): s is ProfilePoster => s !== null)
  const validCompletedMovies = completedMovies.filter((s): s is ProfilePoster => s !== null)
  const validFavoriteMovies = favoriteMovies.filter((s): s is ProfilePoster => s !== null)

  const allFavorites = [...validFavoriteShows, ...validFavoriteMovies]

  const totalShowsWatched = completedShowIds.length
  const totalMoviesWatched = completedMovieIds.length
  // Estimate episodes watched (rough estimate for stats)
  const episodesWatched = totalShowsWatched * 20

  // Backdrop Image Logic
  const backdropUrl = validFavoriteShows.length > 0 
    ? validFavoriteShows[0].poster_url 
    : (validCompletedShows.length > 0 ? validCompletedShows[0].poster_url : null)

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-8 w-full bg-background relative overflow-x-hidden">
      <ProfileHeaderClient 
        profile={profile} 
        userEmail={userEmail} 
        backdropUrl={backdropUrl} 
        isOwner={isOwner}
        isFollowing={isFollowing}
        profileId={profile.id}
      />
      
      <div className="flex flex-col gap-8 -mt-6 relative z-10 w-full overflow-hidden">
        {/* Stats Row */}
        <ProfileStatsCarousel 
          totalShows={totalShowsWatched}
          totalMovies={totalMoviesWatched}
          episodesWatched={episodesWatched}
        />

        {/* Custom Lists (if any) */}
        {userListsData.length > 0 && (
          <ProfileListCarousel lists={userListsData as CustomList[]} />
        )}

        {/* Content Rows */}
        <div className="flex flex-col gap-6">
          {allFavorites.length > 0 && (
            <ProfilePosterCarousel 
              title={
                <div className="flex items-center gap-2">
                  <span>Favorites</span>
                  <Heart size={16} className="fill-red-500 text-red-500" />
                </div>
              }
              items={allFavorites} 
            />
          )}

          {validCompletedShows.length > 0 && (
            <ProfilePosterCarousel 
              title="Watched Shows" 
              items={validCompletedShows} 
            />
          )}

          {validCompletedMovies.length > 0 && (
            <ProfilePosterCarousel 
              title="Watched Movies" 
              items={validCompletedMovies} 
            />
          )}
          
          {allFavorites.length === 0 && validCompletedShows.length === 0 && validCompletedMovies.length === 0 && (
            <div className="px-4 py-12 flex flex-col items-center justify-center text-center opacity-50">
              <p className="text-sm">Nothing to see here yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
