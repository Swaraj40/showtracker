import { getMovieDetails } from '@/lib/tmdb'
import { createClient } from '@/utils/supabase/server'
import { MovieClient } from './MovieClient'

export const dynamic = "force-dynamic"

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const movie = await getMovieDetails(p.id)
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentStatus = null
  let isFavorite = false

  if (user) {
    const { data: movieData } = await supabase
      .from('user_movies')
      .select('status, is_favorite')
      .eq('movie_id', movie.id)
      .eq('user_id', user.id)
      .single()
    
    if (movieData) {
      currentStatus = movieData.status
      isFavorite = movieData.is_favorite
    }
  }

  const { count: commentsCount } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('media_type', 'movie')
    .eq('media_id', movie.id)

  return (
    <MovieClient 
      movie={movie} 
      initialStatus={currentStatus} 
      initialIsFavorite={isFavorite} 
      user={user}
      commentsCount={commentsCount || 0}
    />
  )
}
