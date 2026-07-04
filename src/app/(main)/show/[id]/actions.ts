'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateShowStatus(showId: number, status: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  if (status === null) {
    await supabase.from('user_shows').delete().match({ user_id: user.id, show_id: showId })
  } else {
    await supabase.from('user_shows').upsert(
      { user_id: user.id, show_id: showId, status, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,show_id' }
    )
  }

  revalidatePath(`/show/${showId}`)
}

export async function toggleEpisode(showId: number, seasonNumber: number, episodeNumber: number, watched: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  if (watched) {
    await supabase.from('user_episodes').upsert(
      { user_id: user.id, show_id: showId, season_number: seasonNumber, episode_number: episodeNumber },
      { onConflict: 'user_id,show_id,season_number,episode_number' }
    )
  } else {
    await supabase.from('user_episodes').delete().match({
      user_id: user.id,
      show_id: showId,
      season_number: seasonNumber,
      episode_number: episodeNumber
    })
  }

  revalidatePath(`/show/${showId}`)
}
