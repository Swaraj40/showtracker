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

  const { data: comments } = await supabase
    .from('comments')
    .select('*, profiles!comments_user_id_fkey(display_name, avatar_url)')
    .eq('media_type', 'movie')
    .eq('media_id', movie.id)
    .order('created_at', { ascending: false })

  return (
    <MovieClient 
      movie={movie} 
      initialStatus={currentStatus} 
      initialIsFavorite={isFavorite} 
      user={user}
      comments={comments || []}
    />
  )
}
