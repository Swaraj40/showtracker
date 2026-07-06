'use client'

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { updateMovieStatus } from '@/app/(main)/movies/[id]/actions'

export function QuickTrackMovieButton({ 
  movieId, 
  isTracked 
}: { 
  movieId: number, 
  isTracked: boolean 
}) {
  const [loading, setLoading] = useState(false)
  const [tracked, setTracked] = useState(isTracked)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault() // prevent navigating to the movie page
    e.stopPropagation()
    
    if (loading) return
    setLoading(true)
    // Quick track usually adds to watchlist for movies
    const newStatus = tracked ? null : 'watchlist'
    await updateMovieStatus(movieId, newStatus)
    setTracked(!tracked)
    setLoading(false)
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={loading}
      className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center border-2 rounded-md transition-colors z-20 ${
        tracked 
          ? 'border-[#FFD54F] text-black bg-[#FFD54F]' 
          : 'border-[#FFD54F] text-[#FFD54F] bg-background/50 hover:bg-[#FFD54F] hover:text-black'
      }`}
    >
      {loading ? (
        <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      ) : tracked ? (
        <Check size={20} strokeWidth={3} />
      ) : (
        <Plus size={20} strokeWidth={3} />
      )}
    </button>
  )
}
