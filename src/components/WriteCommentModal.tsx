'use client'

import { useState, useTransition } from 'react'
import { X, Star, Loader2, Image as ImageIcon } from 'lucide-react'
import { submitComment } from '@/app/actions/comments'
import { motion, AnimatePresence } from 'framer-motion'

export function WriteCommentModal({
  isOpen,
  onClose,
  mediaId,
  mediaType
}: {
  isOpen: boolean
  onClose: () => void
  mediaId: number
  mediaType: 'movie' | 'show'
}) {
  const [rating, setRating] = useState<number>(0)
  const [content, setContent] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('media_id', mediaId.toString())
        formData.append('media_type', mediaType)
        formData.append('content', content)
        if (rating > 0) formData.append('rating', rating.toString())
        if (photoUrl) formData.append('photo_url', photoUrl)
        
        await submitComment(formData)
        onClose()
      } catch (err: any) {
        setError(err.message || 'Failed to post comment')
      }
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4"
        >
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="w-full max-w-lg bg-surface rounded-2xl overflow-hidden border border-border"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-foreground font-bold text-lg">Write a Comment</h2>
              <button onClick={onClose} className="p-2 -mr-2 text-foreground-muted hover:text-foreground">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-6">
              {error && <div className="text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg">{error}</div>}

              {/* Rating */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-foreground-muted text-sm font-bold tracking-widest">TAP TO RATE</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star size={32} className={rating >= star ? 'fill-[#FFD54F] text-[#FFD54F]' : 'text-foreground-muted'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What did you think?"
                className="w-full bg-surface-elevated text-foreground rounded-xl p-4 min-h-[120px] outline-none border border-border focus:border-[#444] resize-none"
                required
              />

              {/* Photo URL */}
              <div className="flex flex-col gap-2">
                <label className="text-foreground-muted text-sm font-bold flex items-center gap-2">
                  <ImageIcon size={16} /> Attach a photo (URL)
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-surface-elevated text-foreground rounded-lg p-3 outline-none border border-border focus:border-[#444]"
                />
                {photoUrl && (
                  <div className="mt-2 w-full h-32 rounded-lg overflow-hidden bg-background">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" onError={() => setError('Invalid image URL')} onLoad={() => setError(null)} />
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isPending || !content.trim()}
                className="w-full py-4 bg-[#FFD54F] text-black font-bold rounded-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="animate-spin" size={20} /> : 'POST COMMENT'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
