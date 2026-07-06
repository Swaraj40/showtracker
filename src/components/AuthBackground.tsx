import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export function AuthBackground({ posters, children }: { posters: string[], children: React.ReactNode }) {
  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col font-sans text-white">
      
      {/* Background Poster Grid */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="flex w-full h-[300%] -mt-[100%] gap-0">
          {[0, 1, 2, 3].map((colIndex) => {
            const colPosters = posters.slice(colIndex * 15, (colIndex + 1) * 15)
            const duplicated = [...colPosters, ...colPosters]
            const animationClass = colIndex % 2 === 0 ? 'animate-scroll-up' : 'animate-scroll-down'
            
            return (
              <div key={colIndex} className={`flex-1 flex flex-col gap-0 ${animationClass}`}>
                {duplicated.map((url, i) => (
                  <div key={i} className="relative w-full aspect-[2/3] bg-gray-900 overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Dark Overlay Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen items-center justify-center px-6 py-12">
        
        {/* Top Header - Back Button & Logo */}
        <div className="absolute top-0 left-0 w-full flex items-center p-6 gap-4">
          <Link href="/welcome" className="flex items-center gap-1 text-white hover:text-gray-300 transition-colors z-20 bg-black/40 px-3 py-2 rounded-full backdrop-blur-md">
            <ChevronLeft size={20} />
            <span className="font-medium pr-1">Back</span>
          </Link>
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center justify-center w-8 h-8 bg-[#FFD54F] rounded-md shadow-[0_0_10px_rgba(255,213,79,0.5)]">
              <span className="text-black font-black text-lg tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>TT</span>
            </div>
            <span className="text-white font-bold text-xl tracking-wide">TV track</span>
          </div>
        </div>

        {/* Auth Form Children */}
        <div className="w-full max-w-md bg-transparent p-8 mt-8">
          {children}
        </div>
      </div>
    </div>
  )
}
