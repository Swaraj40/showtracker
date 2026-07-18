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
      profiles (
        display_name,
        avatar_url,
        username
      )
    `)
    .eq('media_type', 'show')
    .eq('media_id', showId)
    .order('created_at', { ascending: false })

  return (
    <CommentsClient
      mediaId={showId}
      mediaType="show"
      mediaTitle={show.name}
      comments={comments || []}
      isLoggedIn={!!user}
    />
  )
}
