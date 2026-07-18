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
