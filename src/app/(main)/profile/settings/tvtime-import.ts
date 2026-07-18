'use server'

import { createClient } from '@/utils/supabase/server'
import { searchShows, searchMovies } from '@/lib/tmdb'
import { revalidatePath } from 'next/cache'

// Resolve a batch of unique shows/movies
export async function resolveTmdbBatch(items: { name: string, type: 'show' | 'movie' }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const results: Record<string, number> = {}

  for (const item of items) {
    try {
      if (item.type === 'show') {
        const tmdbResults = await searchShows(item.name)
        if (tmdbResults && tmdbResults.length > 0) {
          results[item.name] = tmdbResults[0].id
        }
      } else {
        const tmdbResults = await searchMovies(item.name)
        if (tmdbResults && tmdbResults.length > 0) {
          results[item.name] = tmdbResults[0].id
        }
      }
    } catch (err) {
      console.error('TMDB search error for', item.name, err)
    }
    // Small delay to respect TMDB rate limits
    await new Promise(r => setTimeout(r, 100))
  }

  return results
}

// Insert a batch of records
export async function insertTvTimeDataBatch(
  shows: { show_id: number, status: string }[],
  episodes: { show_id: number, season_number: number, episode_number: number, watched_at: string }[],
  movies: { movie_id: number, status: string }[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Inject user_id and timestamps
  const showsToInsert = shows.map(s => ({
    ...s,
    user_id: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  const episodesToInsert = episodes.map(e => ({
    ...e,
    user_id: user.id
  }))

  const moviesToInsert = movies.map(m => ({
    ...m,
    user_id: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  if (showsToInsert.length > 0) {
    const { error } = await supabase.from('user_shows').upsert(showsToInsert, { onConflict: 'user_id, show_id' })
    if (error) throw new Error('Error importing TV Time shows: ' + error.message)
  }

  if (episodesToInsert.length > 0) {
    const { error } = await supabase.from('user_episodes').upsert(episodesToInsert, { onConflict: 'user_id, show_id, season_number, episode_number' })
    if (error) throw new Error('Error importing TV Time episodes: ' + error.message)
  }

  if (moviesToInsert.length > 0) {
    const { error } = await supabase.from('user_movies').upsert(moviesToInsert, { onConflict: 'user_id, movie_id' })
    if (error) throw new Error('Error importing TV Time movies: ' + error.message)
  }
}

export async function finishImport() {
  revalidatePath('/[...catchall]', 'layout')
}
