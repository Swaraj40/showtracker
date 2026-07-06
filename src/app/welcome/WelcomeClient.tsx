'use client'

import { useState, useEffect } from 'react'
import { Heart, Bell, Calendar, Check, ThumbsUp } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: <Heart size={32} className="text-white" />,
    text: "Discover your new favorite show"
  },
  {
    icon: <Bell size={32} className="text-white" />,
    text: "Never miss an episode"
  },
  {
    icon: <Calendar size={32} className="text-white" />,
    text: "Remember where you left off"
  },
  {
    icon: <Check size={32} className="text-white" />,
    text: "Track your shows and movies"
  },
  {
    icon: <ThumbsUp size={32} className="text-white" />,
    text: "Help make your favorite shows even better"
  }
]

export default function WelcomeClient({ posters }: { posters: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col font-sans">
      
      {/* Background Poster Grid */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        {/* We create 4 columns. We duplicate the posters in each column to allow seamless 50% scrolling */}
        <div className="flex w-full h-[300%] -mt-[100%] gap-0">
          {[0, 1, 2, 3].map((colIndex) => {
            const colPosters = posters.slice(colIndex * 15, (colIndex + 1) * 15)
            // Duplicate to allow seamless scroll loop
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
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full items-center px-6">
        
        {/* Header / Logo */}
        <div className="flex items-center gap-3 mt-16 mb-auto">
          {/* Unique TT Logo */}
          <div className="flex items-center justify-center w-12 h-12 bg-[#FFD54F] rounded-lg shadow-[0_0_15px_rgba(255,213,79,0.5)]">
            <span className="text-black font-black text-2xl tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>TT</span>
          </div>
          <span className="text-white font-bold text-3xl tracking-wide">TV track</span>
        </div>

        {/* Animated Carousel Center */}
        <div className="flex flex-col items-center justify-center w-full min-h-[150px] mb-auto relative">
          {features.map((feature, i) => (
            <div 
              key={i} 
              className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ${
                i === currentIndex 
                  ? 'opacity-100 transform translate-y-0 scale-100' 
                  : 'opacity-0 transform translate-y-8 scale-95 pointer-events-none'
              }`}
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-black/80 backdrop-blur-md border border-white/10 mb-6 shadow-xl">
                {feature.icon}
              </div>
              <h2 className="text-white text-2xl sm:text-3xl font-bold text-center leading-tight max-w-[80%] drop-shadow-lg">
                {feature.text}
              </h2>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="w-full max-w-sm mb-12">
          <Link href="/login" className="flex items-center justify-center w-full py-4 bg-[#FFD54F] text-black rounded-xl font-bold text-[15px] tracking-wide hover:bg-[#FFC107] transition-colors shadow-lg active:scale-[0.98]">
            SIGN UP / LOG IN
          </Link>
        </div>

      </div>
    </div>
  )
}
