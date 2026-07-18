'use client'

import React, { useState, useEffect } from 'react'
import JSZip from 'jszip'
import Papa from 'papaparse'
import { resolveTmdbBatch, insertTvTimeDataBatch, finishImport } from './tvtime-import'

type ImportState = 'idle' | 'unzipping' | 'parsing' | 'resolving' | 'importing' | 'completed' | 'error'

interface ImportProgressModalProps {
  file: File | null
  onClose: () => void
}

export function ImportProgressModal({ file, onClose }: ImportProgressModalProps) {
  const [state, setState] = useState<ImportState>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (file && state === 'idle') {
      startImport(file)
    }
  }, [file, state])

  const startImport = async (file: File) => {
    try {
      setState('unzipping')
      setProgress({ current: 0, total: 100, message: 'Reading ZIP file...' })

      const zip = await JSZip.loadAsync(file)
      
      const seenEpisodesFile = zip.file('seen_episodes.csv')
      const moviesFile = zip.file('movies.csv') // Movies might be named differently, but we'll try 'movies.csv' or 'tracked_movies.csv'

      if (!seenEpisodesFile && !moviesFile) {
        throw new Error('Could not find seen_episodes.csv or movies.csv in the zip file. Are you sure this is a TV Time GDPR export?')
      }

      setState('parsing')
      setProgress({ current: 0, total: 100, message: 'Parsing CSV data...' })

      const uniqueShows = new Map<string, { season: number, episode: number, date: string }[]>()
      const uniqueMovies = new Map<string, string>() // title -> date

      if (seenEpisodesFile) {
        const text = await seenEpisodesFile.async('text')
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          step: (results: any) => {
            const row = results.data
            const showName = row['tv_show_name'] || row['show_name'] || row['Name'] || row['tv_show']
            const season = parseInt(row['tv_show_season_number'] || row['season_number'] || row['Season'])
            const episode = parseInt(row['tv_show_episode_number'] || row['episode_number'] || row['Episode'])
            const date = row['updated_at'] || row['created_at'] || row['Date'] || new Date().toISOString()
            
            if (showName && !isNaN(season) && !isNaN(episode)) {
              if (!uniqueShows.has(showName)) {
                uniqueShows.set(showName, [])
              }
              uniqueShows.get(showName)!.push({ season, episode, date })
            }
          }
        })
      }

      if (moviesFile) {
        const text = await moviesFile.async('text')
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          step: (results: any) => {
            const row = results.data
            const movieName = row['movie_name'] || row['Name'] || row['title']
            const date = row['updated_at'] || row['created_at'] || row['Date'] || new Date().toISOString()
            if (movieName) {
              uniqueMovies.set(movieName, date)
            }
          }
        })
      }

      const showNames = Array.from(uniqueShows.keys())
      const movieNames = Array.from(uniqueMovies.keys())
      
      const totalToResolve = showNames.length + movieNames.length
      if (totalToResolve === 0) {
        throw new Error('No valid shows or movies found in the CSV files.')
      }

      setState('resolving')
      let resolvedCount = 0
      const resolvedShowIds: Record<string, number> = {}
      const resolvedMovieIds: Record<string, number> = {}

      // Resolve shows in chunks of 10
      for (let i = 0; i < showNames.length; i += 10) {
        setProgress({ current: resolvedCount, total: totalToResolve, message: `Finding Shows (${resolvedCount}/${totalToResolve})` })
        const chunk = showNames.slice(i, i + 10).map(n => ({ name: n, type: 'show' as const }))
        const res = await resolveTmdbBatch(chunk)
        Object.assign(resolvedShowIds, res)
        resolvedCount += chunk.length
      }

      // Resolve movies in chunks of 10
      for (let i = 0; i < movieNames.length; i += 10) {
        setProgress({ current: resolvedCount, total: totalToResolve, message: `Finding Movies (${resolvedCount}/${totalToResolve})` })
        const chunk = movieNames.slice(i, i + 10).map(n => ({ name: n, type: 'movie' as const }))
        const res = await resolveTmdbBatch(chunk)
        Object.assign(resolvedMovieIds, res)
        resolvedCount += chunk.length
      }

      setState('importing')
      
      // Prepare bulk insert arrays
      const showsToInsert: any[] = []
      const episodesToInsert: any[] = []
      const moviesToInsert: any[] = []

      for (const [showName, episodes] of Array.from(uniqueShows.entries())) {
        const tmdbId = resolvedShowIds[showName]
        if (tmdbId) {
          showsToInsert.push({ show_id: tmdbId, status: 'watching' })
          for (const ep of episodes) {
            episodesToInsert.push({
              show_id: tmdbId,
              season_number: ep.season,
              episode_number: ep.episode,
              watched_at: ep.date
            })
          }
        }
      }

      for (const [movieName, date] of Array.from(uniqueMovies.entries())) {
        const tmdbId = resolvedMovieIds[movieName]
        if (tmdbId) {
          moviesToInsert.push({ movie_id: tmdbId, status: 'completed', watched_at: date }) // Note: watched_at might not exist in user_movies, but it's safe to omit or pass
        }
      }

      // Deduplicate before insert
      const uniqueShowsToInsert = Array.from(new Map(showsToInsert.map(s => [s.show_id, s])).values())
      const uniqueEpisodesToInsert = Array.from(new Map(episodesToInsert.map(e => [`${e.show_id}-${e.season_number}-${e.episode_number}`, e])).values())
      
      const totalToInsert = uniqueShowsToInsert.length + uniqueEpisodesToInsert.length + moviesToInsert.length
      setProgress({ current: 0, total: totalToInsert, message: `Saving ${totalToInsert} records to database...` })

      // Batch insert in chunks of 500
      let insertedCount = 0
      const CHUNK_SIZE = 500
      
      // Since `insertTvTimeDataBatch` takes shows, episodes, and movies separately, we'll chunk episodes (the largest array)
      // For simplicity, we'll insert shows first, then chunk episodes, then movies.
      
      if (uniqueShowsToInsert.length > 0) {
        await insertTvTimeDataBatch(uniqueShowsToInsert, [], [])
        insertedCount += uniqueShowsToInsert.length
        setProgress({ current: insertedCount, total: totalToInsert, message: `Saving ${totalToInsert} records to database...` })
      }

      for (let i = 0; i < uniqueEpisodesToInsert.length; i += CHUNK_SIZE) {
        const chunk = uniqueEpisodesToInsert.slice(i, i + CHUNK_SIZE)
        await insertTvTimeDataBatch([], chunk, [])
        insertedCount += chunk.length
        setProgress({ current: insertedCount, total: totalToInsert, message: `Saving ${totalToInsert} records to database...` })
      }

      if (moviesToInsert.length > 0) {
        await insertTvTimeDataBatch([], [], moviesToInsert)
        insertedCount += moviesToInsert.length
        setProgress({ current: insertedCount, total: totalToInsert, message: `Saving ${totalToInsert} records to database...` })
      }

      await finishImport()
      setState('completed')

    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'An unknown error occurred during import.')
      setState('error')
    }
  }

  if (!file) return null

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-surface-elevated w-full max-w-md rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl border border-border">
        
        {state === 'completed' ? (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Import Complete!</h2>
            <p className="text-foreground-muted text-sm mb-6">Your TV Time data has been successfully imported into your account.</p>
            <button 
              onClick={onClose}
              className="w-full bg-[#FFD54F] text-black font-bold py-3 rounded-xl hover:bg-[#FFC107] transition-colors"
            >
              Continue
            </button>
          </>
        ) : state === 'error' ? (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Import Failed</h2>
            <p className="text-red-400 text-sm mb-6">{errorMsg}</p>
            <button 
              onClick={onClose}
              className="w-full bg-surface text-foreground font-bold py-3 rounded-xl hover:bg-surface-elevated transition-colors border border-border"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 border-4 border-surface border-t-[#FFD54F] rounded-full animate-spin mb-6" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              {state === 'unzipping' && 'Extracting ZIP...'}
              {state === 'parsing' && 'Analyzing Data...'}
              {state === 'resolving' && 'Matching Titles...'}
              {state === 'importing' && 'Saving to Profile...'}
            </h2>
            <p className="text-foreground-muted text-sm mb-6">{progress.message}</p>
            
            <div className="w-full bg-surface rounded-full h-3 mb-2 overflow-hidden border border-border">
              <div 
                className="bg-[#FFD54F] h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between w-full text-xs text-foreground-muted font-medium">
              <span>{progress.current} / {progress.total}</span>
              <span>{percentage}%</span>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
