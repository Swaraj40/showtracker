'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getSeasonDetails, getShowDetails, TMDBEpisode } from '@/lib/tmdb'

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

export async function getSeasonDetailsAction(showId: number, seasonNumber: number): Promise<TMDBEpisode[]> {
  // Wrap the TMDB fetch in a Server Action so it can access process.env.TMDB_API_KEY securely
  return getSeasonDetails(showId, seasonNumber);
}

export async function markWatchedAndGetNext(showId: number, seasonNumber: number, episodeNumber: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Mark current as watched
  await toggleEpisode(showId, seasonNumber, episodeNumber, true)

  // 2. Fetch updated watched list for this show
  const { data: watchedEpisodes } = await supabase
    .from('user_episodes')
    .select('season_number, episode_number')
    .eq('user_id', user.id)
    .eq('show_id', showId)

  const watchedSet = new Set((watchedEpisodes || []).map(e => `${e.season_number}-${e.episode_number}`))

  // 3. Find next episode
  const details = await getShowDetails(showId)
  
  let nextSeason = -1
  let nextEp = -1
  let totalUnwatched = 0
  let nextEpName = ''

  for (const season of details.seasons || []) {
    if (season.season_number === 0) continue

    for (let ep = 1; ep <= season.episode_count; ep++) {
      if (!watchedSet.has(`${season.season_number}-${ep}`)) {
        if (nextSeason === -1) {
          nextSeason = season.season_number
          nextEp = ep
        }
        totalUnwatched++
      }
    }
  }

  // If we found a next episode, fetch its real name from TMDB
  if (nextSeason !== -1) {
    try {
      const seasonData = await getSeasonDetails(showId, nextSeason)
      const epData = seasonData.find(e => e.episode_number === nextEp)
      if (epData) {
        nextEpName = epData.name
      }
    } catch (e) {
      // fallback if TMDB fails
    }
  }

  // Revalidate the shows page to keep data fresh, but we return data so UI doesn't have to wait
  revalidatePath('/shows')

  if (nextSeason === -1) {
    return null // Show completed
  }

  return {
    season: nextSeason,
    episode: nextEp,
    name: nextEpName || `Episode ${nextEp}`,
    episodesLeft: totalUnwatched - 1
  }
}

export async function toggleFavoriteShow(showId: number, isFavorite: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // We only want to update the is_favorite column, so we use upsert but only set status if it doesn't exist?
  // Upsert might overwrite status if we don't fetch it first.
  const { data: existing } = await supabase
    .from('user_shows')
    .select('status')
    .eq('user_id', user.id)
    .eq('show_id', showId)
    .single()

  await supabase.from('user_shows').upsert(
    { 
      user_id: user.id, 
      show_id: showId, 
      is_favorite: isFavorite,
      status: existing?.status || 'watchlist', // default to watchlist if it didn't exist
      updated_at: new Date().toISOString() 
    },
    { onConflict: 'user_id,show_id' }
  )

  revalidatePath(`/show/${showId}`)
}

export async function markSeasonWatched(showId: number, seasonNumber: number, episodeCount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const episodesToInsert = []
  for (let ep = 1; ep <= episodeCount; ep++) {
    episodesToInsert.push({
      user_id: user.id,
      show_id: showId,
      season_number: seasonNumber,
      episode_number: ep
    })
  }

  await supabase.from('user_episodes').upsert(
    episodesToInsert,
    { onConflict: 'user_id,show_id,season_number,episode_number' }
  )

  revalidatePath(`/show/${showId}`)
}

export async function unmarkSeasonWatched(showId: number, seasonNumber: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  await supabase.from('user_episodes').delete().match({
    user_id: user.id,
    show_id: showId,
    season_number: seasonNumber
  })

  revalidatePath(`/show/${showId}`)
}
