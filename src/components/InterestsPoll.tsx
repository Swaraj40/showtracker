'use client'

import { useState, useEffect } from 'react'
import { getInterests, voteInterest } from '@/app/actions/interestsActions'

const OPTIONS = [
  'THE CAST',
  'THE PREMISE',
  'THE CREATORS',
  'THE STUDIO',
  'THE FRANCHISE OR UNIVERSE',
  'OTHER'
]

export default function InterestsPoll({ itemId, itemType, title }: { itemId: number, itemType: 'movie' | 'show', title?: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [userVote, setUserVote] = useState<string | null>(null)
  const [totalVotes, setTotalVotes] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchVotes = async () => {
      const data = await getInterests(itemId, itemType)
      if (mounted) {
        setCounts(data.counts)
        setUserVote(data.userVote)
        setTotalVotes(data.totalVotes)
        setLoading(false)
      }
    }
    fetchVotes()
    return () => { mounted = false }
  }, [itemId, itemType])

  const handleVote = async (interest: string) => {
    if (userVote === interest) return // Already voted for this

    // Optimistic update
    const previousVote = userVote
    const newCounts = { ...counts }
    
    if (previousVote) {
      newCounts[previousVote] = Math.max(0, (newCounts[previousVote] || 1) - 1)
    } else {
      setTotalVotes(prev => prev + 1)
    }
    newCounts[interest] = (newCounts[interest] || 0) + 1
    
    setCounts(newCounts)
    setUserVote(interest)

    try {
      const data = await voteInterest(itemId, itemType, interest)
      setCounts(data.counts)
      setUserVote(data.userVote)
      setTotalVotes(data.totalVotes)
    } catch (err) {
      // Revert if error
      alert('Failed to cast vote')
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 border-b border-border">
        <h3 className="text-foreground-muted text-xs font-bold tracking-widest text-center mb-4 uppercase">
          {title || 'WHAT INTERESTS YOU MOST ABOUT THIS?'}
        </h3>
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 border-b border-border">
      <h3 className="text-foreground-muted text-xs font-bold tracking-widest text-center mb-4 uppercase">
        {title || 'WHAT INTERESTS YOU MOST ABOUT THIS?'}
      </h3>
      
      <div className="flex flex-col gap-2">
        {OPTIONS.map(interest => {
          const count = counts[interest] || 0
          // Add 1 to total and to option if 0 votes overall to avoid 0%, optionally just show 0%
          const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)
          const isSelected = userVote === interest
          
          if (!userVote) {
            // Before voting state
            return (
              <button 
                key={interest} 
                onClick={() => handleVote(interest)}
                className="w-full py-3 bg-surface-elevated hover:bg-surface-elevated/80 text-foreground-muted font-bold text-sm rounded-md transition-colors"
              >
                {interest}
              </button>
            )
          }

          // After voting state (bar chart)
          return (
            <div 
              key={interest} 
              onClick={() => handleVote(interest)}
              className="relative w-full h-12 bg-[#1A1A1A] rounded-sm overflow-hidden flex items-center cursor-pointer group"
            >
              {/* The progress bar background */}
              <div 
                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out ${
                  isSelected ? 'bg-[#3b82f6]' : 'bg-[#737373]'
                }`}
                style={{ width: `${percentage}%` }}
              />
              
              {/* Content overlay */}
              <div className="relative z-10 flex justify-between items-center w-full px-4 text-xs font-bold tracking-wider">
                <span className={isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white transition-colors'}>
                  {interest}
                </span>
                <span className="text-gray-400">
                  {percentage}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
