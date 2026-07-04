'use client'

import { useState } from 'react'
import { updateShowStatus } from './actions'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useDevice } from '@/hooks/useDevice'

const STATUSES = [
  { value: 'watching', label: 'Watching' },
  { value: 'watchlist', label: 'Watchlist' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'completed', label: 'Completed' },
]

export function TrackButton({ showId, currentStatus }: { showId: number, currentStatus: string | null }) {
  const [loading, setLoading] = useState(false)
  const { ref, focused } = useFocusable()
  const { isTV } = useDevice()

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true)
    const val = e.target.value === 'none' ? null : e.target.value
    await updateShowStatus(showId, val)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-4">
      <select
        // @ts-ignore
        ref={isTV ? ref : null}
        disabled={loading}
        value={currentStatus || 'none'}
        onChange={handleStatusChange}
        className={`bg-gray-800 text-white px-4 py-2 rounded-lg outline-none transition-all ${
          focused ? 'ring-4 ring-white scale-105' : 'focus:ring-2 focus:ring-blue-500'
        }`}
      >
        <option value="none">Not Tracking</option>
        {STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      {loading && <span className="text-gray-400 text-sm">Saving...</span>}
    </div>
  )
}
