'use client'

import { useEffect } from 'react'

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Profile route error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center bg-black text-red-500">
      <h2 className="text-2xl font-bold">Something went wrong on the Profile page!</h2>
      <div className="bg-red-950/50 p-4 rounded-lg border border-red-900 w-full max-w-lg text-left overflow-auto text-sm">
        <p className="font-mono text-red-400">Error Name: {error.name}</p>
        <p className="font-mono text-red-400">Message: {error.message}</p>
        {error.stack && (
          <pre className="mt-2 text-xs text-red-300/80 whitespace-pre-wrap">
            {error.stack}
          </pre>
        )}
      </div>
      <button
        onClick={() => reset()}
        className="px-6 py-2 mt-4 bg-red-900 hover:bg-red-800 text-white rounded-full font-bold transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
