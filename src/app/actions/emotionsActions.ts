'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getEmotions(itemId: number, itemType: 'movie' | 'show') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('item_emotions')
    .select('emotion, user_id')
    .eq('item_id', itemId)
    .eq('item_type', itemType)

  if (error) {
    console.error('Error fetching emotions:', error)
    return { counts: {}, userVote: null, totalVotes: 0 }
  }

  const counts: Record<string, number> = {}
  let userVote: string | null = null

  data.forEach((row) => {
    counts[row.emotion] = (counts[row.emotion] || 0) + 1
    if (user && row.user_id === user.id) {
      userVote = row.emotion
    }
  })

  return { counts, userVote, totalVotes: data.length }
}

export async function voteEmotion(itemId: number, itemType: 'movie' | 'show', emotion: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('item_emotions')
    .upsert(
      { user_id: user.id, item_id: itemId, item_type: itemType, emotion },
      { onConflict: 'user_id, item_id, item_type' }
    )

  if (error) {
    console.error('Error voting emotion:', error)
    throw new Error('Failed to vote')
  }

  revalidatePath(itemType === 'movie' ? `/movies/${itemId}` : `/show/${itemId}`)
  return await getEmotions(itemId, itemType)
}
