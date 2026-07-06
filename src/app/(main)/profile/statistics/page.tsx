import { createClient } from '@/utils/supabase/server'
import { getShowDetails, getMovieDetails } from '@/lib/tmdb'
import { redirect } from 'next/navigation'
import { StatisticsClient } from './StatisticsClient'

export const dynamic = "force-dynamic"

export default async function StatisticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  try {
    // Fetch all user episodes
    const { data: userEpisodes, error: err1 } = await supabase
      .from('user_episodes')
      .select('show_id, watched_at')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
    if (err1) throw new Error(err1.message)

    // Fetch all user movies
    const { data: userMovies, error: err2 } = await supabase
      .from('user_movies')
      .select('movie_id, status, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
    if (err2 && err2.code !== '42703') throw new Error(err2.message)

    // Fetch all user shows
    const { data: userShows, error: err3 } = await supabase
      .from('user_shows')
      .select('show_id, status, created_at')
      .eq('user_id', user.id)
    if (err3 && err3.code !== '42703') throw new Error(err3.message)

    const episodes = userEpisodes || []
    const movies = userMovies || []
    const shows = userShows || []

    // 1. Fetch TMDB details
    const uniqueShowIds = Array.from(new Set(shows.map(s => s.show_id)))
    const uniqueMovieIds = Array.from(new Set(movies.map(m => m.movie_id)))

    const showDetailsPromises = uniqueShowIds.map(id => getShowDetails(id).catch(() => null))
    const movieDetailsPromises = uniqueMovieIds.map(id => getMovieDetails(id).catch(() => null))

    const [showsData, moviesData] = await Promise.all([
      Promise.all(showDetailsPromises),
      Promise.all(movieDetailsPromises)
    ])

    const showsMap = new Map(showsData.filter(Boolean).map(s => [s!.id, s]))
    const moviesMap = new Map(moviesData.filter(Boolean).map(m => [m!.id, m]))

    // --- SHOW STATISTICS ---
    const totalEpisodes = episodes.length
    const totalShowHours = Math.floor((totalEpisodes * 45) / 60)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const episodesLast7Days = episodes.filter(e => e.watched_at && new Date(e.watched_at) >= sevenDaysAgo).length
    const showHoursLast7Days = Math.floor((episodesLast7Days * 45) / 60)

    const monthLetters = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
    const currentMonthDate = new Date()
    
    // Monthly Episodes & Hours
    const monthlyShows = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - i, 1)
      const monthLetter = monthLetters[d.getMonth()]
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1)
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      
      const count = episodes.filter(e => {
         if (!e.watched_at) return false
         const date = new Date(e.watched_at)
         return date >= startOfMonth && date <= endOfMonth
      }).length
      monthlyShows.push({ 
        month: monthLetter, 
        hours: Math.floor((count * 45) / 60), 
        count,
        isCurrent: i === 0 
      })
    }

    // Weekly Episodes
    const weeklyShows = []
    // Get ISO week number roughly
    const getWeek = (date: Date) => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
    }
    
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - (i * 7) - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      
      const count = episodes.filter(e => {
        if (!e.watched_at) return false
        const date = new Date(e.watched_at)
        return date >= startOfWeek && date <= endOfWeek
      }).length
      
      weeklyShows.push({
        week: getWeek(startOfWeek).toString(),
        count,
        isCurrent: i === 0
      })
    }

    // Marathons
    const marathonMap: Record<string, { showId: number, count: number }> = {}
    episodes.forEach(e => {
      if (!e.watched_at) return
      const dateStr = new Date(e.watched_at).toISOString().split('T')[0]
      const key = `${e.show_id}_${dateStr}`
      if (!marathonMap[key]) marathonMap[key] = { showId: e.show_id, count: 0 }
      marathonMap[key].count++
    })
    const biggestMarathons = Object.values(marathonMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(m => {
        const showDetails = showsMap.get(m.showId)
        return {
          showName: showDetails?.name || `Show ${m.showId}`,
          episodes: m.count,
          hours: Math.floor((m.count * 45) / 60)
        }
      })

    // Added shows
    const addedShows = shows.length
    const inProductionShows = Array.from(showsMap.values()).filter(s => s!.status === 'Returning Series' || s!.status === 'In Production').length

    // Genres & Networks
    const showGenreCount: Record<string, number> = {}
    const showNetworkCount: Record<string, number> = {}
    shows.forEach(s => {
      const details = showsMap.get(s.show_id)
      if (details?.genres) {
        details.genres.forEach(g => { showGenreCount[g.name] = (showGenreCount[g.name] || 0) + 1 })
      }
      if (details?.networks) {
        details.networks.forEach(n => { showNetworkCount[n.name] = (showNetworkCount[n.name] || 0) + 1 })
      }
    })
    const topShowGenres = Object.entries(showGenreCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5)
    const topShowNetworks = Object.entries(showNetworkCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5)


    // --- MOVIE STATISTICS ---
    let totalMovieMinutes = 0
    let movieMinutesLast7Days = 0
    movies.forEach(m => {
       const details = moviesMap.get(m.movie_id)
       const runtime = details?.runtime || 120
       totalMovieMinutes += runtime
       if (m.updated_at && new Date(m.updated_at) >= sevenDaysAgo) {
          movieMinutesLast7Days += runtime
       }
    })
    const totalMovieHours = Math.floor(totalMovieMinutes / 60)
    const movieHoursLast7Days = Math.floor(movieMinutesLast7Days / 60)
    const moviesLast7Days = movies.filter(m => m.updated_at && new Date(m.updated_at) >= sevenDaysAgo).length

    // Monthly Movies
    const monthlyMovies = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - i, 1)
      const monthLetter = monthLetters[d.getMonth()]
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1)
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      
      let count = 0
      let minutes = 0
      movies.forEach(m => {
         if (!m.updated_at) return
         const date = new Date(m.updated_at)
         if (date >= startOfMonth && date <= endOfMonth) {
           count++
           minutes += (moviesMap.get(m.movie_id)?.runtime || 120)
         }
      })
      monthlyMovies.push({ 
        month: monthLetter, 
        hours: Math.floor(minutes / 60), 
        count,
        isCurrent: i === 0 
      })
    }

    // Weekly Movies
    const weeklyMovies = []
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - (i * 7) - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      
      const count = movies.filter(m => {
        if (!m.updated_at) return false
        const date = new Date(m.updated_at)
        return date >= startOfWeek && date <= endOfWeek
      }).length
      
      weeklyMovies.push({
        week: getWeek(startOfWeek).toString(),
        count,
        isCurrent: i === 0
      })
    }

    // Movie Genres
    const movieGenreCount: Record<string, number> = {}
    movies.forEach(m => {
      const details = moviesMap.get(m.movie_id)
      if (details?.genres) {
        details.genres.forEach(g => { movieGenreCount[g.name] = (movieGenreCount[g.name] || 0) + 1 })
      }
    })
    const topMovieGenres = Object.entries(movieGenreCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5)


    const statsData = {
      shows: {
        totalHours: totalShowHours,
        hoursLast7Days: showHoursLast7Days,
        totalEpisodes,
        episodesLast7Days,
        monthlyData: monthlyShows,
        weeklyData: weeklyShows,
        biggestMarathons,
        addedShows,
        inProductionShows,
        topGenres: topShowGenres,
        topNetworks: topShowNetworks
      },
      movies: {
        totalHours: totalMovieHours,
        hoursLast7Days: movieHoursLast7Days,
        totalMovies: movies.length,
        moviesLast7Days,
        monthlyData: monthlyMovies,
        weeklyData: weeklyMovies,
        topGenres: topMovieGenres
      }
    }

    return <StatisticsClient statsData={statsData} />
  } catch (err: any) {
    return <div className="p-8 text-foreground bg-red-900">Error loading statistics: {err?.message || 'Unknown error'}</div>
  }
}
