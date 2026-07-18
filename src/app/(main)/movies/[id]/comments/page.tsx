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

  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles!comments_user_id_fkey (
        display_name,
        avatar_url,
        username
      ),
      likes:comment_likes(count)
    `)
    .eq('media_type', 'movie')
    .eq('media_id', movieId)
    .order('created_at', { ascending: false })

  // Also fetch user's likes for these comments if logged in
  let userLikedCommentIds = new Set<string>()
  if (user && comments && comments.length > 0) {
    const { data: userLikes } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', user.id)
      .in('comment_id', comments.map(c => c.id))
    
    if (userLikes) {
      userLikes.forEach(l => userLikedCommentIds.add(l.comment_id))
    }
  }

  // Format comments to include like counts and user like status
  const formattedComments = (comments || []).map(c => ({
    ...c,
    likes_count: c.likes?.[0]?.count || 0,
    user_liked: userLikedCommentIds.has(c.id)
  }))

  return (
    <div className="w-full">
      {error && (
        <div className="p-4 bg-red-100 text-red-600 rounded-md m-4">
          Error loading comments: {error.message || JSON.stringify(error)}
        </div>
      )}
      <CommentsClient
        mediaId={movieId}
        mediaType="movie"
        mediaTitle={movie.title}
        comments={formattedComments}
        isLoggedIn={!!user}
        currentUserId={user?.id}
      />
    </div>
  )
}
