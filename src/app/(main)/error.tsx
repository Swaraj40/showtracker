'use client'

import { useEffect } from 'react'

export default function GlobalMainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global Main route error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center bg-black text-red-500 z-[9999] fixed inset-0">
      <h2 className="text-2xl font-bold">A Critical Error Occurred!</h2>
      <div className="bg-red-950/50 p-4 rounded-lg border border-red-900 w-full max-w-lg text-left overflow-auto text-sm">
        <p className="font-mono text-red-400 font-bold">Error Name: {error.name}</p>
        <p className="font-mono text-red-400 mt-2 font-bold break-words">Message: {error.message}</p>
        {error.stack && (
          <pre className="mt-2 text-[10px] text-red-300/80 whitespace-pre-wrap">
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
