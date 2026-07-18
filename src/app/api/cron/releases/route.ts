import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getShowDetails, getMovieDetails } from '@/lib/tmdb'

// We need a service role client to bypass RLS for cron jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Ensure the user adds this to .env.local

export async function GET(request: Request) {
  // 1. Verify authorization (e.g. from Vercel Cron)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 })
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  // 2. Fetch all tracked items across all users
  const { data: userShows } = await supabaseAdmin
    .from('user_shows')
    .select('user_id, show_id, status')
    .in('status', ['watching', 'plan_to_watch'])
    
  const { data: userMovies } = await supabaseAdmin
    .from('user_movies')
    .select('user_id, movie_id, status')
    .eq('status', 'plan_to_watch')

  if (!userShows && !userMovies) {
    return NextResponse.json({ success: true, message: 'No tracked items' })
  }

  const uniqueShowIds = Array.from(new Set((userShows || []).map(s => s.show_id)))
  const uniqueMovieIds = Array.from(new Set((userMovies || []).map(m => m.movie_id)))

  const today = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'
  
  const notificationsToInsert: any[] = []

  // 3. Process Shows (Check for new episodes today)
  for (const showId of uniqueShowIds) {
    try {
      const showDetails = await getShowDetails(showId)
      // Check next episode to air or last episode to air
      const lastEpisode = showDetails.last_episode_to_air
      const nextEpisode = showDetails.next_episode_to_air
      
      let releasedToday = false
      if (lastEpisode && lastEpisode.air_date === today) releasedToday = true
      if (nextEpisode && nextEpisode.air_date === today) releasedToday = true

      if (releasedToday) {
        // Find users tracking this show
        const interestedUsers = (userShows || []).filter(s => s.show_id === showId)
        for (const u of interestedUsers) {
          notificationsToInsert.push({
            user_id: u.user_id,
            actor_id: u.user_id, // Self-actor for system notifications
            type: 'new_episode',
            metadata: { show_id: showId, title: showDetails.name }
          })
        }
      }
    } catch (e) {
      console.error(`Failed to fetch show ${showId}`, e)
    }
  }

  // 4. Process Movies (Check for releases today)
  for (const movieId of uniqueMovieIds) {
    try {
      const movieDetails = await getMovieDetails(movieId)
      if (movieDetails.release_date === today) {
        const interestedUsers = (userMovies || []).filter(m => m.movie_id === movieId)
        for (const u of interestedUsers) {
          notificationsToInsert.push({
            user_id: u.user_id,
            actor_id: u.user_id,
            type: 'movie_release',
            metadata: { movie_id: movieId, title: movieDetails.title }
          })
        }
      }
    } catch (e) {
      console.error(`Failed to fetch movie ${movieId}`, e)
    }
  }

  // 5. Insert Notifications
  if (notificationsToInsert.length > 0) {
    // Avoid inserting duplicates if cron runs multiple times a day
    // We can do this by checking recent notifications, but for simplicity we'll insert directly.
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert(notificationsToInsert)
      
    if (error) {
      console.error('Error inserting notifications', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ 
    success: true, 
    notificationsSent: notificationsToInsert.length 
  })
}
