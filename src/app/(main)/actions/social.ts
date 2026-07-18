'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function likeComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('comment_likes')
    .insert({ user_id: user.id, comment_id: commentId })

  if (error) throw error

  // Fetch the comment to get the author
  const { data: comment } = await supabase
    .from('comments')
    .select('user_id, media_id, media_type')
    .eq('id', commentId)
    .single()

  if (comment && comment.user_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: comment.user_id,
      actor_id: user.id,
      type: 'like',
      metadata: { media_id: comment.media_id, media_type: comment.media_type }
    })
  }

  revalidatePath('/[...catchall]', 'layout')
}

export async function unlikeComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('comment_likes')
    .delete()
    .eq('user_id', user.id)
    .eq('comment_id', commentId)

  if (error) throw error
  revalidatePath('/[...catchall]', 'layout')
}

export async function postReply(parentId: string, mediaId: number, mediaType: 'movie' | 'show', content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      media_id: mediaId,
      media_type: mediaType,
      content,
      parent_id: parentId
    })

  if (error) throw error

  // Fetch parent comment to notify the author
  const { data: parentComment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', parentId)
    .single()

  if (parentComment && parentComment.user_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: parentComment.user_id,
      actor_id: user.id,
      type: 'reply',
      metadata: { media_id: mediaId, media_type: mediaType }
    })
  }

  revalidatePath('/[...catchall]', 'layout')
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) throw error
  revalidatePath('/[...catchall]', 'layout')
}
