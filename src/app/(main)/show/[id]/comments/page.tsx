import { getShowDetails } from '@/lib/tmdb'
import { createClient } from '@/utils/supabase/server'
import { CommentsClient } from '@/components/CommentsClient'

export const dynamic = "force-dynamic"

export default async function ShowCommentsPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const showId = parseInt(p.id, 10)
  
  const show = await getShowDetails(p.id)
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: comments } = await supabase
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
    .eq('media_type', 'show')
    .eq('media_id', showId)
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
    <CommentsClient
      mediaId={showId}
      mediaType="show"
      mediaTitle={show.name}
      comments={formattedComments}
      isLoggedIn={!!user}
      currentUserId={user?.id}
    />
  )
}
