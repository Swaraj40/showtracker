'use server'

import { searchShows, searchMovies } from '@/lib/tmdb'
import { createClient } from '@/utils/supabase/server'

// Simple CSV line parser that handles quotes
function parseCSVLine(text: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result.map(s => s.trim())
}

export async function importTvTimeData(fileContent: string, isJson: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const itemsToImport: { title: string, season?: number, episode?: number, type: 'show' | 'movie', watchedAt?: string }[] = []

  if (isJson) {
    try {
      const data = JSON.parse(fileContent)
      // Attempt to extract from GDPR JSON
      // TV Time GDPR JSON can be in various formats. A common one has `.data.objects[]` or just an array.
      const objects = data?.data?.objects || (Array.isArray(data) ? data : [])
      
      for (const obj of objects) {
        if (obj?.meta?.name) { // typical GDPR format for shows/movies
          itemsToImport.push({
            title: obj.meta.name,
            season: obj.season_number,
            episode: obj.episode_number,
            type: obj.meta.type === 'movie' ? 'movie' : 'show',
            watchedAt: obj.watched_at || new Date().toISOString()
          })
        }
      }
    } catch (err) {
      return { success: false, error: 'Failed to parse JSON file' }
    }
  } else {
    // Parse CSV
    const lines = fileContent.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length > 0) {
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase())
      
      // Find indexes
      const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('name'))
      const seasonIdx = headers.findIndex(h => h.includes('season'))
      const episodeIdx = headers.findIndex(h => h.includes('episode'))
      const typeIdx = headers.findIndex(h => h.includes('type'))
      const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('watched'))

      if (titleIdx === -1) {
        return { success: false, error: 'Could not find a Title or Show Name column in CSV' }
      }

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i])
        if (row.length <= titleIdx || !row[titleIdx]) continue
        
        const title = row[titleIdx]
        const typeStr = typeIdx !== -1 ? row[typeIdx].toLowerCase() : ''
        const type = typeStr.includes('movie') ? 'movie' : 'show'

        itemsToImport.push({
          title,
          season: seasonIdx !== -1 ? parseInt(row[seasonIdx]) : undefined,
          episode: episodeIdx !== -1 ? parseInt(row[episodeIdx]) : undefined,
          type,
          watchedAt: dateIdx !== -1 ? new Date(row[dateIdx]).toISOString() : new Date().toISOString()
        })
      }
    }
  }

  if (itemsToImport.length === 0) {
    return { success: false, error: 'No recognizable shows or movies found in the file' }
  }

  // Cache for TMDB IDs to avoid redundant lookups
  const showIdCache = new Map<string, number>()
  const movieIdCache = new Map<string, number>()

  const showsToInsert: any[] = []
  const episodesToInsert: any[] = []
  const moviesToInsert: any[] = []

  // Process items (limit to 100 to avoid TMDB rate limits, or do it sequentially with a small delay)
  // Since we are matching by name, this is slow. We'll process sequentially.
  let matchedCount = 0

  for (const item of itemsToImport) {
    if (item.type === 'show') {
      let tmdbId = showIdCache.get(item.title)
      
      if (!tmdbId) {
        try {
          const results = await searchShows(item.title)
          if (results && results.length > 0) {
            tmdbId = results[0].id
            showIdCache.set(item.title, tmdbId)
          }
        } catch (err) {
          console.error('TMDB search error for', item.title)
        }
        // Small delay to prevent rate limits
        await new Promise(r => setTimeout(r, 100)) 
      }

      if (tmdbId) {
        matchedCount++
        showsToInsert.push({
          user_id: user.id,
          show_id: tmdbId,
          status: 'watching',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        if (item.season !== undefined && item.episode !== undefined && !isNaN(item.season) && !isNaN(item.episode)) {
          episodesToInsert.push({
            user_id: user.id,
            show_id: tmdbId,
            season_number: item.season,
            episode_number: item.episode,
            watched_at: item.watchedAt || new Date().toISOString()
          })
        }
      }
    } else {
      let tmdbId = movieIdCache.get(item.title)
      if (!tmdbId) {
        try {
          const results = await searchMovies(item.title)
          if (results && results.length > 0) {
            tmdbId = results[0].id
            movieIdCache.set(item.title, tmdbId)
          }
        } catch (err) {
           console.error('TMDB search error for', item.title)
        }
        await new Promise(r => setTimeout(r, 100))
      }

      if (tmdbId) {
        matchedCount++
        moviesToInsert.push({
          user_id: user.id,
          movie_id: tmdbId,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }
  }

  // Deduplicate to avoid unique constraint errors before upserting
  const uniqueShows = Array.from(new Map(showsToInsert.map(s => [`${s.user_id}-${s.show_id}`, s])).values())
  const uniqueEpisodes = Array.from(new Map(episodesToInsert.map(e => [`${e.user_id}-${e.show_id}-${e.season_number}-${e.episode_number}`, e])).values())
  const uniqueMovies = Array.from(new Map(moviesToInsert.map(m => [`${m.user_id}-${m.movie_id}`, m])).values())

  if (uniqueShows.length > 0) {
    const { error } = await supabase.from('user_shows').upsert(uniqueShows, { onConflict: 'user_id, show_id' })
    if (error) console.error('Error importing TV Time shows:', error)
  }

  if (uniqueEpisodes.length > 0) {
    const { error } = await supabase.from('user_episodes').upsert(uniqueEpisodes, { onConflict: 'user_id, show_id, season_number, episode_number' })
    if (error) console.error('Error importing TV Time episodes:', error)
  }

  if (uniqueMovies.length > 0) {
    const { error } = await supabase.from('user_movies').upsert(uniqueMovies, { onConflict: 'user_id, movie_id' })
    if (error) console.error('Error importing TV Time movies:', error)
  }

  return { 
    success: true, 
    message: `Successfully matched and imported ${matchedCount} items from TV Time! (out of ${itemsToImport.length} records)` 
  }
}
