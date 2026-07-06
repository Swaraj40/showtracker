'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getRatings(itemId: number, itemType: 'movie' | 'show') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('item_ratings')
    .select('rating, user_id')
    .eq('item_id', itemId)
    .eq('item_type', itemType)

  if (error) {
    console.error('Error fetching ratings:', error)
    return { counts: {}, userVote: null, totalVotes: 0 }
  }

  const counts: Record<number, number> = {}
  let userVote: number | null = null

  data.forEach((row) => {
    counts[row.rating] = (counts[row.rating] || 0) + 1
    if (user && row.user_id === user.id) {
      userVote = row.rating
    }
  })

  return { counts, userVote, totalVotes: data.length }
}

export async function voteRating(itemId: number, itemType: 'movie' | 'show', rating: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('item_ratings')
    .upsert(
      { user_id: user.id, item_id: itemId, item_type: itemType, rating },
      { onConflict: 'user_id, item_id, item_type' }
    )

  if (error) {
    console.error('Error voting rating:', error)
    throw new Error('Failed to vote')
  }

  revalidatePath(itemType === 'movie' ? `/movies/${itemId}` : `/show/${itemId}`)
  return await getRatings(itemId, itemType)
}
