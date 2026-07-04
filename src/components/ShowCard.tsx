'use client'

import { TMDBShow } from '@/lib/tmdb'
import Link from 'next/link'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useDevice } from '@/hooks/useDevice'

export function ShowCard({ show }: { show: TMDBShow }) {
  const { isTV } = useDevice()
  const { ref, focused } = useFocusable()

  const posterUrl = show.poster_path 
    ? (show.poster_path.startsWith('http') ? show.poster_path : `https://image.tmdb.org/t/p/w500${show.poster_path}`)
    : '/placeholder.jpg'

  return (
    <Link 
      href={`/show/${show.id}`}
      // @ts-ignore
      ref={isTV ? ref : null}
      className={`group relative flex flex-col gap-2 rounded-xl overflow-hidden transition-all duration-300 ease-out outline-none ${
        focused ? 'scale-110 shadow-2xl z-10 ring-4 ring-white' : 'hover:scale-105 opacity-90 hover:opacity-100'
      }`}
    >
      <div className="relative aspect-[2/3] w-full bg-gray-800 rounded-xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={posterUrl} 
          alt={show.name}
          className="object-cover w-full h-full"
        />
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3 transition-opacity ${focused || !isTV ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <h3 className="text-white font-bold text-sm line-clamp-2">{show.name}</h3>
          <p className="text-xs text-gray-300">{new Date(show.first_air_date).getFullYear()}</p>
        </div>
      </div>
    </Link>
  )
}
