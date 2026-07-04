'use client'

import { useState, useEffect } from 'react'
import { getSeasonDetails, TMDBEpisode } from '@/lib/tmdb'
import { toggleEpisode } from './actions'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useDevice } from '@/hooks/useDevice'

export function EpisodeItem({ 
  showId, 
  seasonNumber, 
  episodeCount,
  watchedEpisodes,
  isLoggedIn
}: { 
  showId: number, 
  seasonNumber: number, 
  episodeCount: number,
  watchedEpisodes: string[],
  isLoggedIn: boolean
}) {
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSeasonDetails(showId, seasonNumber).then(data => {
      setEpisodes(data)
      setLoading(false)
    })
  }, [showId, seasonNumber])

  if (loading) return <div className="text-gray-500 p-4">Loading episodes...</div>

  return (
    <>
      {episodes.map(ep => (
        <EpisodeRow 
          key={ep.id} 
          episode={ep} 
          showId={showId} 
          isWatched={watchedEpisodes.includes(`${seasonNumber}-${ep.episode_number}`)}
          isLoggedIn={isLoggedIn}
        />
      ))}
    </>
  )
}

function EpisodeRow({ episode, showId, isWatched, isLoggedIn }: { episode: TMDBEpisode, showId: number, isWatched: boolean, isLoggedIn: boolean }) {
  const [loading, setLoading] = useState(false)
  const { ref, focused } = useFocusable()
  const { isTV } = useDevice()

  const handleToggle = async () => {
    if (!isLoggedIn || loading) return
    setLoading(true)
    await toggleEpisode(showId, episode.season_number, episode.episode_number, !isWatched)
    setLoading(false)
  }

  return (
    <div 
      // @ts-ignore
      ref={isTV ? ref : null}
      onClick={handleToggle}
      className={`flex items-center justify-between p-4 bg-gray-900 rounded-xl transition-all cursor-pointer ${
        focused ? 'ring-2 ring-white scale-[1.01] bg-gray-800' : 'hover:bg-gray-800'
      } ${isWatched ? 'opacity-50' : ''}`}
    >
      <div className="flex flex-col gap-1">
        <span className="font-bold text-lg">
          {episode.episode_number}. {episode.name}
        </span>
        <span className="text-sm text-gray-400">{episode.air_date}</span>
      </div>
      {isLoggedIn && (
        <button 
          disabled={loading}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
            isWatched ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-transparent hover:border-blue-500'
          }`}
        >
          ✓
        </button>
      )}
    </div>
  )
}
