export const dynamic = "force-dynamic"

import { SearchInput } from '@/components/SearchInput'
import { ShowCard } from '@/components/ShowCard'
import { searchShows } from '@/lib/tmdb'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams;
  const query = params.q || ''
  const results = query ? await searchShows(query) : []

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Search</h1>
      <SearchInput initialQuery={query} />
      
      {query && results.length === 0 && (
        <p className="text-gray-400">No results found for "{query}"</p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>
      )}
    </div>
  )
}
