import { getMovieDetails } from '@/lib/tmdb'
import { createClient } from '@/utils/supabase/server'
import { CommentsClient } from '@/components/CommentsClient'

export const dynamic = "force-dynamic"

export default async function MovieCommentsPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const movieId = parseInt(p.id, 10)
  
  const movie = await getMovieDetails(p.id)
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (
        display_name,
        avatar_url
      )
    `)
    .eq('media_type', 'movie')
    .eq('media_id', movieId)
    .order('created_at', { ascending: false })

  return (
    <CommentsClient
      mediaId={movieId}
      mediaType="movie"
      mediaTitle={movie.title}
      comments={comments || []}
      isLoggedIn={!!user}
    />
  )
}
