import { getTrendingShows, getUpcomingMovies } from '@/lib/tmdb'
import { AuthBackground } from '@/components/AuthBackground'

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let fullPosters: string[] = []

  try {
    const shows = await getTrendingShows()
    const movies = await getUpcomingMovies()
    
    const posters = shuffleArray([...shows, ...movies])
      .map(item => item.poster_path)
      .filter(Boolean)
      .map(path => `https://image.tmdb.org/t/p/w500${path}`)
      
    fullPosters = [...posters]
    while (fullPosters.length < 60) {
      fullPosters = [...fullPosters, ...posters]
    }
    fullPosters = fullPosters.slice(0, 60)
  } catch (e) {
    fullPosters = Array(60).fill('https://via.placeholder.com/500x750/111827/374151?text=TV+track')
  }

  return (
    <AuthBackground posters={fullPosters}>
      {children}
    </AuthBackground>
  )
}
