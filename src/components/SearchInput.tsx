'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useDevice } from '@/hooks/useDevice'

export function SearchInput({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const { ref, focused } = useFocusable()
  const { isTV } = useDevice()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="mb-8 w-full max-w-2xl">
      <input
        // @ts-ignore
        ref={isTV ? ref : null}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for shows..."
        className={`w-full bg-surface-elevated text-foreground rounded-xl px-6 py-4 outline-none transition-all ${
          focused ? 'ring-4 ring-white scale-[1.02]' : 'focus:ring-2 focus:ring-blue-500'
        }`}
      />
    </form>
  )
}
