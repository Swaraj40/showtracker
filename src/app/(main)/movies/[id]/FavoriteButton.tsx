'use client'

import { useTransition } from 'react'
import { Heart } from 'lucide-react'
import { toggleFavoriteMovie } from './actions'

export function FavoriteButton({ movieId, isFavorite }: { movieId: number, isFavorite: boolean }) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      await toggleFavoriteMovie(movieId, !isFavorite)
    })
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className={`p-3 rounded-full shadow-lg border transition-all ${
        isFavorite 
          ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20' 
          : 'bg-background/60 border-gray-600 text-foreground hover:bg-background/80'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
    >
      <Heart className={isFavorite ? 'fill-current' : ''} size={24} />
    </button>
  )
}
