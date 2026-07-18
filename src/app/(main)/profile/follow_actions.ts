'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFollow(followingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  if (user.id === followingId) {
    throw new Error('Cannot follow yourself')
  }

  // Check if already following
  const { data: existingFollow } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single()

  if (existingFollow) {
    // Unfollow
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
  } else {
    // Follow
    await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: followingId
      })

    // Notify the user being followed (only if notifications_enabled)
    // Actually, by default they probably want the notification. The notifications_enabled flag is for the follower receiving notifications about the followingId.
    // Wait, the new 'notifications_enabled' column we just added is to determine if follower_id receives notifications about following_id's activity.
    // But when someone follows YOU, you should get a notification regardless, unless there's a global setting. We will just send it.
    await supabase.from('notifications').insert({
      user_id: followingId,
      actor_id: user.id,
      type: 'follow',
      metadata: {}
    })
  }

  revalidatePath('/u/[username]', 'page')
  return !existingFollow
}

export async function toggleNotifications(followingId: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('follows')
    .update({ notifications_enabled: !currentStatus })
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  if (error) {
    throw new Error(error.message)
  }

  return !currentStatus
}
