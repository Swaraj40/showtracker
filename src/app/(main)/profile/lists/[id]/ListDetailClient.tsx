'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Play, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ListDetailClient({ list }: { list: any }) {
  const router = useRouter()
  const items = list.items || []

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/profile/lists')}
              className="p-2 hover:bg-surface-elevated rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">{list.name}</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
              <LayoutGrid className="text-foreground-muted" size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2">No items yet</h2>
            <p className="text-foreground-muted max-w-sm">
              You haven't added any shows or movies to this list yet. Go to a show or movie page to add them!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {items.map((item: any) => (
              <div 
                key={item.id} 
                onClick={() => router.push(item.media_type === 'movie' ? `/movies/${item.id}` : `/show/${item.id}`)}
                className="aspect-[2/3] bg-surface-elevated rounded-xl overflow-hidden relative group cursor-pointer hover:scale-[1.05] transition-transform duration-300"
              >
                {item.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.name || 'Poster'}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center border border-border">
                    <LayoutGrid className="text-foreground-muted mb-2" size={24} />
                    <span className="text-xs text-foreground-muted font-medium line-clamp-2">
                      {item.name}
                    </span>
                  </div>
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#FFD54F] flex items-center justify-center pl-1">
                    <Play className="text-black" size={20} fill="currentColor" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
