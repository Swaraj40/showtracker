'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Character = {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export function CharacterPoll({ characters }: { characters: Character[] }) {
  const [votedId, setVotedId] = useState<number | null>(null)
  
  // Simulate vote counts if this were connected to a DB
  const baseVotes = {
    [characters[0]?.id]: 420,
    [characters[1]?.id]: 280
  }

  const handleVote = (id: number) => {
    setVotedId(id)
  }

  const getPercentage = (id: number) => {
    const totalVotes = Object.values(baseVotes).reduce((a, b) => a + b, 0) + 1
    const myVotes = (baseVotes[id] || 0) + (votedId === id ? 1 : 0)
    return Math.round((myVotes / totalVotes) * 100)
  }

  if (!characters || characters.length < 2) return null;

  return (
    <div className="w-full bg-surface-elevated py-4 rounded-b-md overflow-hidden relative">
      <div className="text-center mb-3">
        <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">Who was your favorite?</span>
      </div>
      
      <div className="flex items-center justify-center gap-4 px-4 h-[120px]">
        <AnimatePresence mode="popLayout">
          {characters.slice(0, 2).map((char) => (
            <motion.div 
              key={char.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-md overflow-hidden cursor-pointer"
              style={{ width: votedId ? (votedId === char.id ? '65%' : '35%') : '50%', height: '100%', transition: 'width 0.4s ease-in-out' }}
              onClick={() => handleVote(char.id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={char.profile_path ? (char.profile_path.startsWith('http') ? char.profile_path : `https://image.tmdb.org/t/p/w185${char.profile_path}`) : '/placeholder.jpg'} 
                alt={char.character}
                className={`w-full h-full object-cover transition-opacity duration-300 ${votedId && votedId !== char.id ? 'opacity-40' : 'opacity-100 hover:scale-105 transition-transform'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 pointer-events-none">
                {votedId && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-between items-end"
                  >
                    <span className="text-foreground text-xs font-bold leading-tight truncate pr-1">{char.character}</span>
                    <span className="text-[#FFD54F] font-bold text-lg leading-none">{getPercentage(char.id)}%</span>
                  </motion.div>
                )}
              </div>
              
              {/* Fill bar overlay when voted */}
              {votedId && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${getPercentage(char.id)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="absolute bottom-0 left-0 right-0 bg-[#FFD54F]/20 pointer-events-none border-t border-[#FFD54F]/50"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
