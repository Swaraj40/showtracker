'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'

type ListItem = {
  id: number
  media_type: 'tv' | 'movie'
  name: string
  poster_path: string | null
}

type ListDetailClientProps = {
  list: {
    id: string
    name: string
    items: ListItem[]
  }
}

export default function ListDetailClient({ list }: ListDetailClientProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-y-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-surface">
        <div className="flex items-center px-4 h-14 relative">
          <button onClick={() => router.back()} className="p-2 -ml-2 absolute left-4 z-10">
            <ChevronLeft size={24} />
          </button>
          <h1 className="flex-1 text-center font-bold text-[17px] truncate px-12">{list.name}</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <h2 className="text-2xl font-black text-white">{list.name}</h2>
        
        {list.items.length === 0 ? (
          <div className="text-center mt-12 text-foreground-muted">
            This list is empty.
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {list.items.map((item, index) => (
              <div 
                key={`${item.media_type}-${item.id}-${index}`}
                onClick={() => router.push(item.media_type === 'tv' ? `/show/${item.id}` : `/movies/${item.id}`)}
                className="cursor-pointer group flex flex-col gap-2"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface">
                  {item.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground-muted text-xs text-center p-2">
                      No Poster
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold line-clamp-2 leading-tight">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
