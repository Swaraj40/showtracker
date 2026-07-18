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
  }

  revalidatePath('/u/[username]', 'page')
  return !existingFollow
}
