'use client'

import { useState, useEffect } from 'react'
import { getEmotions, voteEmotion } from '@/app/actions/emotionsActions'

const FEELINGS = [
  { id: 'shocked', emoji: '😵', label: 'SHOCKED' },
  { id: 'frustrated', emoji: '😤', label: 'FRUSTRATED' },
  { id: 'sad', emoji: '😭', label: 'SAD' },
  { id: 'reflective', emoji: '🤔', label: 'REFLECTIVE' },
  { id: 'touched', emoji: '🥺', label: 'TOUCHED' },
  { id: 'amused', emoji: '😆', label: 'AMUSED' },
  { id: 'scared', emoji: '😱', label: 'SCARED' },
  { id: 'bored', emoji: '😑', label: 'BORED' },
  { id: 'understood', emoji: '😌', label: 'UNDERSTOOD' },
  { id: 'thrilled', emoji: '🤩', label: 'THRILLED' },
  { id: 'confused', emoji: '🙃', label: 'CONFUSED' },
  { id: 'tense', emoji: '😬', label: 'TENSE' },
]

export default function EmotionPoll({ itemId, itemType, title }: { itemId: number, itemType: 'movie' | 'show', title?: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [userVote, setUserVote] = useState<string | null>(null)
  const [totalVotes, setTotalVotes] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchVotes = async () => {
      const data = await getEmotions(itemId, itemType)
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

  const handleVote = async (emotionId: string) => {
    if (userVote === emotionId) return

    const previousVote = userVote
    const newCounts = { ...counts }
    
    if (previousVote) {
      newCounts[previousVote] = Math.max(0, (newCounts[previousVote] || 1) - 1)
    } else {
      setTotalVotes(prev => prev + 1)
    }
    newCounts[emotionId] = (newCounts[emotionId] || 0) + 1
    
    setCounts(newCounts)
    setUserVote(emotionId)

    try {
      const data = await voteEmotion(itemId, itemType, emotionId)
      setCounts(data.counts)
      setUserVote(data.userVote)
      setTotalVotes(data.totalVotes)
    } catch (err) {
      alert('Failed to save emotion')
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-8 border-b border-border">
        <h3 className="text-foreground-muted text-xs font-bold tracking-widest text-center mb-6 uppercase">{title || 'HOW DID YOU FEEL?'}</h3>
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 border-b border-border">
      <h3 className="text-foreground-muted text-xs font-bold tracking-widest text-center mb-6 uppercase">
        {title || 'HOW DID YOU FEEL?'}
      </h3>
      
      <div className="grid grid-cols-4 gap-4">
        {FEELINGS.map((f) => {
          const count = counts[f.id] || 0
          const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)
          const isSelected = userVote === f.id
          
          return (
            <button 
              key={f.id}
              onClick={() => handleVote(f.id)}
              className="flex flex-col items-center gap-2 group transition-transform hover:scale-105 active:scale-95"
            >
              <div 
                className={`w-16 h-12 rounded-lg flex items-center justify-center text-3xl transition-colors ${
                  isSelected ? 'bg-[#FDE047]' : 'bg-[#1A1A1A] group-hover:bg-[#2A2A2A]'
                }`}
              >
                {/* For upside down emoji if confused is selected and it matches screenshot, we can just use normal emoji for now */}
                {f.emoji}
              </div>
              <div className="flex flex-col items-center h-8 justify-between">
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-foreground-muted group-hover:text-white'}`}>
                  {f.label}
                </span>
                {userVote !== null && (
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-foreground-muted'}`}>
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
