export const dynamic = "force-dynamic"

import { getTrendingShows } from '@/lib/tmdb'
import { Plus } from 'lucide-react'

export default async function DiscoverPage() {
  const trending = await getTrendingShows()
  
  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Nav */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-[#1E1E1E] overflow-x-auto no-scrollbar">
        <span className="font-bold text-sm text-gray-400 cursor-pointer">FEED</span>
        <span className="font-bold text-sm bg-[#FFD54F] text-black px-4 py-1.5 rounded-full cursor-pointer">DISCOVER</span>
        <span className="font-bold text-sm text-gray-400 cursor-pointer">GROUPS</span>
        <span className="font-bold text-sm text-gray-400 cursor-pointer">ACTIVITY</span>
      </div>
      
      <div className="flex flex-col gap-1 mt-4 px-2">
        {trending.map((show) => {
          const backdropUrl = show.backdrop_path ? (show.backdrop_path.startsWith('http') ? show.backdrop_path : `https://image.tmdb.org/t/p/w780${show.backdrop_path}`) : '/placeholder.jpg'
          
          return (
            <a key={show.id} href={`/show/${show.id}`} className="block relative w-full h-[240px] md:h-[300px] mb-4 bg-gray-900 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={backdropUrl} alt={show.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/30 to-transparent" />
              
              {/* Add Button */}
              <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-[#FFD54F] rounded-md text-[#FFD54F] bg-black/50 hover:bg-[#FFD54F] hover:text-black transition-colors">
                <Plus size={20} strokeWidth={3} />
              </button>

              <div className="absolute bottom-4 left-4 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-white text-xl font-bold tracking-wide">{show.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300 font-semibold mt-1">
                  <span>{new Date(show.first_air_date).getFullYear()}</span>
                  <span>•</span>
                  <span>{show.vote_average.toFixed(1)} Rating</span>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
