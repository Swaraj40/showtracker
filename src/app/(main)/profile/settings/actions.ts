'use server'

import { createClient } from '@/utils/supabase/server'

export async function exportLibrary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Fetch all user data
  const [showsRes, episodesRes, moviesRes] = await Promise.all([
    supabase.from('user_shows').select('show_id, status, created_at, updated_at').eq('user_id', user.id),
    supabase.from('user_episodes').select('show_id, season_number, episode_number, watched_at').eq('user_id', user.id),
    supabase.from('user_movies').select('movie_id, status, created_at, updated_at').eq('user_id', user.id),
  ])

  if (showsRes.error) throw showsRes.error
  if (episodesRes.error) throw episodesRes.error
  if (moviesRes.error) throw moviesRes.error

  const exportData = {
    version: 1,
    shows: showsRes.data,
    episodes: episodesRes.data,
    movies: moviesRes.data,
  }

  return JSON.stringify(exportData, null, 2)
}

export async function importLibrary(jsonString: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    const data = JSON.parse(jsonString)
    
    // Validate format roughly
    if (!data.shows && !data.episodes && !data.movies) {
      throw new Error('Invalid backup format')
    }

    const { shows = [], episodes = [], movies = [] } = data

    // Insert shows
    if (shows.length > 0) {
      const showsToInsert = shows.map((s: any) => ({
        user_id: user.id,
        show_id: s.show_id,
        status: s.status || 'watching',
        created_at: s.created_at || new Date().toISOString(),
        updated_at: s.updated_at || new Date().toISOString(),
      }))
      
      const { error } = await supabase
        .from('user_shows')
        .upsert(showsToInsert, { onConflict: 'user_id, show_id' })
      if (error) console.error('Error importing shows:', error)
    }

    // Insert episodes
    if (episodes.length > 0) {
      const episodesToInsert = episodes.map((e: any) => ({
        user_id: user.id,
        show_id: e.show_id,
        season_number: e.season_number,
        episode_number: e.episode_number,
        watched_at: e.watched_at || new Date().toISOString(),
      }))
      
      const { error } = await supabase
        .from('user_episodes')
        .upsert(episodesToInsert, { onConflict: 'user_id, show_id, season_number, episode_number' })
      if (error) console.error('Error importing episodes:', error)
    }

    // Insert movies
    if (movies.length > 0) {
      const moviesToInsert = movies.map((m: any) => ({
        user_id: user.id,
        movie_id: m.movie_id,
        status: m.status || 'watchlist',
        created_at: m.created_at || new Date().toISOString(),
        updated_at: m.updated_at || new Date().toISOString(),
      }))
      
      const { error } = await supabase
        .from('user_movies')
        .upsert(moviesToInsert, { onConflict: 'user_id, movie_id' })
      if (error) console.error('Error importing movies:', error)
    }

    return { success: true }
  } catch (err: any) {
    console.error('Import error:', err)
    return { success: false, error: err.message }
  }
}
