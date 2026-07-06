import { getTrendingShows, getUpcomingMovies } from '@/lib/tmdb'
import WelcomeClient from './WelcomeClient'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = "force-dynamic"

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export default async function WelcomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already authenticated, they shouldn't be on the splash screen
  if (user) {
    redirect('/')
  }

  try {
    const shows = await getTrendingShows()
    const movies = await getUpcomingMovies()
    
    // Extract posters from both and shuffle
    const posters = shuffleArray([...shows, ...movies])
      .map(item => item.poster_path)
      .filter(Boolean)
      .map(path => `https://image.tmdb.org/t/p/w500${path}`)
      
    // We want a good amount of posters to fill the screen grid
    // If not enough, we can duplicate the array
    let fullPosters = [...posters]
    while (fullPosters.length < 60) {
      fullPosters = [...fullPosters, ...posters]
    }
    // Limit to 60 posters max
    fullPosters = fullPosters.slice(0, 60)

    return <WelcomeClient posters={fullPosters} />
  } catch (e) {
    // Fallback if TMDB fails
    return <WelcomeClient posters={Array(60).fill('https://via.placeholder.com/500x750/111827/374151?text=TV+track')} />
  }
}
