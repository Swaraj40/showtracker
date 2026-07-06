'use client'

import { useState, useTransition } from 'react'
import { Check, Plus, Loader2 } from 'lucide-react'
import { updateMovieStatus } from './actions'

export function TrackButton({ movieId, currentStatus }: { movieId: number, currentStatus: string | null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(currentStatus)

  const handleStatusChange = (newStatus: string | null) => {
    setIsOpen(false)
    setOptimisticStatus(newStatus)
    startTransition(async () => {
      await updateMovieStatus(movieId, newStatus)
    })
  }

  const getStatusDisplay = () => {
    if (isPending) return <Loader2 className="animate-spin" size={24} />
    if (optimisticStatus === 'completed') return <><Check size={24} /> Watched</>
    if (optimisticStatus === 'watchlist') return <><Plus size={24} /> Watchlist</>
    return <><Plus size={24} /> Add Movie</>
  }

  return (
    <div className="relative w-full max-w-xs">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold shadow-lg transition-all ${
          optimisticStatus === 'completed' 
            ? 'bg-green-500 text-black' 
            : optimisticStatus === 'watchlist'
            ? 'bg-blue-500 text-foreground'
            : 'bg-[#FFD54F] text-black hover:bg-[#ffe17a]'
        }`}
      >
        {getStatusDisplay()}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-full bg-surface-elevated border border-border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
            <button 
              onClick={() => handleStatusChange('watchlist')}
              className="w-full text-left px-4 py-3 text-foreground hover:bg-surface-elevated font-medium"
            >
              Watchlist
            </button>
            <button 
              onClick={() => handleStatusChange('completed')}
              className="w-full text-left px-4 py-3 text-foreground hover:bg-surface-elevated font-medium"
            >
              Watched
            </button>
            {optimisticStatus && (
              <button 
                onClick={() => handleStatusChange(null)}
                className="w-full text-left px-4 py-3 text-red-400 hover:bg-surface-elevated font-medium border-t border-border"
              >
                Remove from My Movies
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
