'use client'

import { useState } from 'react'
import { updateShowStatus } from './actions'
import { Plus, Check } from 'lucide-react'

export function TrackButton({ showId, currentStatus }: { showId: number, currentStatus: string | null }) {
  const [loading, setLoading] = useState(false)
  const isTracked = currentStatus !== null

  const handleToggleTrack = async () => {
    setLoading(true)
    const val = isTracked ? null : 'watching'
    await updateShowStatus(showId, val)
    setLoading(false)
  }

  return (
    <button
      disabled={loading}
      onClick={handleToggleTrack}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold transition-transform active:scale-95 ${
        isTracked 
          ? 'bg-[#1E1E1E] text-[#FFD54F] border-2 border-[#1E1E1E]' 
          : 'bg-[#FFD54F] text-black'
      }`}
    >
      {loading ? (
        <span>Loading...</span>
      ) : isTracked ? (
        <>
          <Check size={20} strokeWidth={3} />
          <span>Added to Profile</span>
        </>
      ) : (
        <>
          <Plus size={20} strokeWidth={3} />
          <span>Add this show</span>
        </>
      )}
    </button>
  )
}
