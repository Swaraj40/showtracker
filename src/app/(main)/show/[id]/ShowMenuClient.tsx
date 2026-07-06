'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit2, Heart, ListPlus, MinusSquare, Share } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AddToListModal } from '@/components/AddToListModal'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function ShowMenuClient({ 
  showId,
  showName,
  initialStatus,
  initialIsFavorite,
  user,
  coverPath
}: {
  showId: number
  showName: string
  initialStatus: string | null
  initialIsFavorite: boolean
  user: any
  coverPath?: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [status, setStatus] = useState(initialStatus)

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    const newFav = !isFavorite
    setIsFavorite(newFav)
    
    if (status) {
      await supabase
        .from('user_shows')
        .update({ is_favorite: newFav })
        .eq('show_id', showId)
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('user_shows')
        .insert({
          user_id: user.id,
          show_id: showId,
          status: 'watching',
          is_favorite: newFav
        })
      setStatus('watching')
    }
    router.refresh()
  }

  const handleRemove = async () => {
    if (!user) return
    setStatus(null)
    setIsFavorite(false)
    setIsMenuOpen(false)
    await supabase
      .from('user_shows')
      .delete()
      .eq('show_id', showId)
      .eq('user_id', user.id)
    router.refresh()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: showName,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing', err)
      }
    }
  }

  return (
    <>
      <button onClick={() => setIsMenuOpen(true)} className="pointer-events-auto text-foreground">
        <MoreHorizontal size={28} />
      </button>

      {/* Bottom Sheet Overlay */}
      {/* Bottom Sheet Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-background/60 z-40"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-50 pb-8 pt-2"
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1 bg-gray-600 rounded-full" />
            </div>
            <div className="flex flex-col">
              <div className="px-4 py-4 border-b border-border">
                <span className="text-foreground-muted text-sm">{status || 'Not tracked'}</span>
              </div>
              
              <button className="flex items-center gap-4 px-4 py-4 border-b border-border text-foreground hover:bg-white/5">
                <Edit2 size={24} className="text-foreground-muted" />
                <span className="text-lg">Customize</span>
              </button>
              
              <button onClick={handleToggleFavorite} className="flex items-center gap-4 px-4 py-4 border-b border-border text-foreground hover:bg-white/5">
                <Heart size={24} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground-muted'} />
                <span className="text-lg">Favorite</span>
              </button>
              
              <button 
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsListModalOpen(true)
                }} 
                className="flex items-center gap-4 px-4 py-4 border-b border-border text-foreground hover:bg-white/5"
              >
                <ListPlus size={24} className="text-foreground-muted" />
                <span className="text-lg">Add to list</span>
              </button>
              
              <button onClick={handleRemove} className="flex items-center gap-4 px-4 py-4 border-b border-border text-foreground hover:bg-white/5">
                <MinusSquare size={24} className="text-foreground-muted" />
                <span className="text-lg">Remove show</span>
              </button>
              
              <button onClick={handleShare} className="flex items-center gap-4 px-4 py-4 text-foreground hover:bg-white/5">
                <Share size={24} className="text-foreground-muted" />
                <span className="text-lg">Share</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add To List Modal */}
      {isListModalOpen && (
        <AddToListModal
          isOpen={isListModalOpen}
          onClose={() => setIsListModalOpen(false)}
          itemId={showId}
          mediaType="tv"
          coverPath={coverPath}
        />
      )}
    </>
  )
}
