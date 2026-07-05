export const TMDB_BASE_URL = 'https://api.tmdb.org/3'

const getHeaders = () => {
  const apiKey = process.env.TMDB_API_KEY
  return {
    Authorization: `Bearer ${apiKey}`,
    accept: 'application/json',
  }
}

export type TMDBShow = {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
}

export type TMDBShowDetails = TMDBShow & {
  number_of_episodes: number
  number_of_seasons: number
  status: string
  episode_run_time: number[]
  genres?: { id: number, name: string }[]
  networks?: { id: number, name: string }[]
  seasons: {
    id: number
    name: string
    overview: string
    poster_path: string
    season_number: number
    episode_count: number
    air_date: string
  }[]
  videos?: {
    results: {
      id: string
      key: string
      name: string
      site: string
      type: string
    }[]
  }
  credits?: {
    cast: {
      id: number
      name: string
      character: string
      profile_path: string | null
    }[]
  }
  external_ids?: {
    imdb_id: string | null
  }
}

export type TMDBEpisode = {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  air_date: string
  still_path: string | null
  vote_average: number
}

export type TMDBMovie = {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
}

export type TMDBMovieDetails = TMDBMovie & {
  runtime: number
  status: string
}

// Fallback TVMaze mapper
const tvMazeToTMDBShow = (show: any): TMDBShow => ({
  id: show.id,
  name: show.name,
  overview: show.summary?.replace(/<[^>]*>?/gm, '') || '',
  poster_path: show.image?.medium || null,
  backdrop_path: show.image?.original || null,
  first_air_date: show.premiered || '',
  vote_average: show.rating?.average || 0
})

export async function searchShows(query: string): Promise<TMDBShow[]> {
  if (!query) return []
  
  if (!process.env.TMDB_API_KEY) {
    const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.map((item: any) => tvMazeToTMDBShow(item.show));
  }

  const res = await fetch(`${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&include_adult=false`, {
    headers: getHeaders(),
    next: { revalidate: 3600 }
  })
  if (!res.ok) throw new Error('Failed to fetch shows')
  const data = await res.json()
  return data.results || []
}

export async function getTrendingShows(): Promise<TMDBShow[]> {
  if (!process.env.TMDB_API_KEY) {
    const res = await fetch(`https://api.tvmaze.com/shows`);
    const data = await res.json();
    return data.slice(0, 20).map(tvMazeToTMDBShow);
  }

  const res = await fetch(`${TMDB_BASE_URL}/trending/tv/week`, {
    headers: getHeaders(),
    next: { revalidate: 86400 } // cache for a day
  })
  if (!res.ok) throw new Error('Failed to fetch trending')
  const data = await res.json()
  return data.results || []
}

export async function getShowDetails(id: string | number): Promise<TMDBShowDetails> {
  if (!process.env.TMDB_API_KEY) {
    const res = await fetch(`https://api.tvmaze.com/shows/${id}?embed=seasons`);
    const data = await res.json();
    
    return {
      ...tvMazeToTMDBShow(data),
      number_of_episodes: 0,
      number_of_seasons: data._embedded?.seasons?.length || 0,
      status: data.status,
      genres: data.genres?.map((g: string, i: number) => ({ id: i, name: g })) || [],
      networks: (data.network || data.webChannel) ? [{ id: (data.network || data.webChannel).id, name: (data.network || data.webChannel).name }] : [],
      episode_run_time: [data.averageRuntime || data.runtime || 45],
      external_ids: { imdb_id: data.externals?.imdb || null },
      seasons: (data._embedded?.seasons || []).map((s: any) => ({
        id: s.id,
        name: s.name || `Season ${s.number}`,
        overview: s.summary?.replace(/<[^>]*>?/gm, '') || '',
        poster_path: s.image?.medium || '',
        season_number: s.number,
        episode_count: s.episodeOrder || 10,
        air_date: s.premiereDate || ''
      }))
    }
  }

  const res = await fetch(`${TMDB_BASE_URL}/tv/${id}?append_to_response=credits,videos,external_ids,watch/providers`, {
    headers: getHeaders(),
    next: { revalidate: 60 }
  })
  if (!res.ok) throw new Error('Failed to fetch show details')
  
  const data = await res.json()
  
  // Merge streaming providers into networks for the "Where to watch" section
  const usProviders = data['watch/providers']?.results?.US?.flatrate || []
  if (usProviders.length > 0) {
    const existingNetworkIds = new Set((data.networks || []).map((n: any) => n.id))
    usProviders.forEach((provider: any) => {
      // Use negative IDs for streaming providers to avoid collision with TMDB network IDs
      if (!existingNetworkIds.has(-provider.provider_id)) {
        data.networks = data.networks || []
        data.networks.push({ id: -provider.provider_id, name: provider.provider_name })
        existingNetworkIds.add(-provider.provider_id)
      }
    })
  }
  
  return data
}

export async function getSeasonDetails(showId: string | number, seasonNumber: number): Promise<TMDBEpisode[]> {
  if (!process.env.TMDB_API_KEY) {
    const res = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
    const data = await res.json();
    const seasonEpisodes = data.filter((e: any) => e.season === seasonNumber);
    return seasonEpisodes.map((e: any) => ({
      id: e.id,
      name: e.name,
      overview: e.summary?.replace(/<[^>]*>?/gm, '') || '',
      episode_number: e.number,
      season_number: e.season,
      air_date: e.airdate,
      still_path: e.image?.medium || null,
      vote_average: e.rating?.average || 0
    }));
  }

  const res = await fetch(`${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}`, {
    headers: getHeaders(),
    next: { revalidate: 86400 }
  })
  if (!res.ok) throw new Error('Failed to fetch season details')
  const data = await res.json()
  return data.episodes || []
}

export async function getTrendingMovies(): Promise<TMDBMovie[]> {
  if (!process.env.TMDB_API_KEY) return []
  const res = await fetch(`${TMDB_BASE_URL}/trending/movie/week`, {
    headers: getHeaders(),
    next: { revalidate: 86400 }
  })
  if (!res.ok) throw new Error('Failed to fetch trending movies')
  const data = await res.json()
  return data.results || []
}

export async function getUpcomingMovies(): Promise<TMDBMovie[]> {
  if (!process.env.TMDB_API_KEY) return []
  const res = await fetch(`${TMDB_BASE_URL}/movie/upcoming`, {
    headers: getHeaders(),
    next: { revalidate: 86400 }
  })
  if (!res.ok) throw new Error('Failed to fetch upcoming movies')
  const data = await res.json()
  return data.results || []
}

export async function getMovieDetails(id: string | number): Promise<TMDBMovieDetails> {
  if (!process.env.TMDB_API_KEY) throw new Error('No API key')
  const res = await fetch(`${TMDB_BASE_URL}/movie/${id}`, {
    headers: getHeaders(),
    next: { revalidate: 86400 }
  })
  if (!res.ok) throw new Error('Failed to fetch movie details')
  return res.json()
}

export async function searchMovies(query: string): Promise<TMDBMovie[]> {
  if (!process.env.TMDB_API_KEY) return []
  const res = await fetch(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false`, {
    headers: getHeaders(),
    next: { revalidate: 3600 }
  })
  if (!res.ok) throw new Error('Failed to fetch movies')
  const data = await res.json()
  return data.results || []
}
