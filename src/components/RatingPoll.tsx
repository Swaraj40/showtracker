'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { getRatings, voteRating } from '@/app/actions/ratingsActions'

const ratingLabels = ['BAD', 'OK', 'GOOD', 'GREAT', 'WOW']

export default function RatingPoll({ itemId, itemType, title }: { itemId: number, itemType: 'movie' | 'show', title?: string }) {
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [userVote, setUserVote] = useState<number | null>(null)
  const [totalVotes, setTotalVotes] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchVotes = async () => {
      const data = await getRatings(itemId, itemType)
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

  const handleVote = async (rating: number) => {
    if (userVote === rating) return

    const previousVote = userVote
    const newCounts = { ...counts }
    
    if (previousVote) {
      newCounts[previousVote] = Math.max(0, (newCounts[previousVote] || 1) - 1)
    } else {
      setTotalVotes(prev => prev + 1)
    }
    newCounts[rating] = (newCounts[rating] || 0) + 1
    
    setCounts(newCounts)
    setUserVote(rating)

    try {
      const data = await voteRating(itemId, itemType, rating)
      setCounts(data.counts)
      setUserVote(data.userVote)
      setTotalVotes(data.totalVotes)
    } catch (err) {
      alert('Failed to save rating')
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-8 border-b border-border">
        <h3 className="text-foreground-muted text-xs font-bold tracking-widest text-center mb-6">{title || 'RATE THIS MOVIE'}</h3>
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 border-b border-border flex flex-col items-center">
      <h3 className="text-foreground-muted text-xs font-bold tracking-widest text-center mb-6 uppercase">
        {title || 'RATE THIS MOVIE'}
      </h3>
      
      <div className="flex justify-center gap-4 bg-surface px-6 py-4 rounded-xl border border-border">
        {[1, 2, 3, 4, 5].map((star) => {
          const count = counts[star] || 0
          const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)
          
          return (
            <button 
              key={star} 
              onClick={() => handleVote(star)} 
              className="flex flex-col items-center gap-2 group transition-transform hover:scale-110 active:scale-95"
            >
              <Star 
                size={36} 
                className={
                  userVote && userVote >= star 
                    ? 'fill-[#FDE047] text-[#FDE047]' // Yellow for selected up to user rating
                    : 'text-foreground-muted fill-[#3f3f46]' // Dark grey for unselected
                } 
              />
              <div className="flex flex-col items-center h-8 justify-between">
                <span className={`text-[10px] font-bold ${userVote === star ? 'text-white' : 'text-foreground-muted'}`}>
                  {ratingLabels[star - 1]}
                </span>
                {userVote !== null && (
                  <span className={`text-[10px] font-bold ${userVote === star ? 'text-white' : 'text-foreground-muted'}`}>
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
