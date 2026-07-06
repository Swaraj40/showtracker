'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera } from 'lucide-react'
import { updateProfile } from './actions'

type EditProfileModalProps = {
  isOpen: boolean
  onClose: () => void
  profile: {
    display_name: string | null
    bio: string | null
    avatar_url: string | null
  }
}

export function EditProfileModal({ isOpen, onClose, profile }: EditProfileModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || '')
  
  useEffect(() => {
    if (isOpen) {
      setAvatarPreview(profile.avatar_url || '')
    }
  }, [isOpen, profile.avatar_url])

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError('')
    try {
      await updateProfile(formData)
      onClose()
    } catch (err) {
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111111] border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Edit Profile</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-elevated text-foreground-muted hover:text-foreground transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form action={handleSubmit} className="p-4 flex flex-col gap-4">
                {error && (
                  <div className="bg-red-900/30 text-red-400 p-3 rounded-md text-sm border border-red-900/50">
                    {error}
                  </div>
                )}
                
                {/* Avatar URL Input */}
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={avatarPreview || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                      alt="Avatar Preview" 
                      className="w-24 h-24 rounded-full border-2 border-border object-cover bg-background"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="avatar_url" className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Profile Picture URL</label>
                  <input
                    type="url"
                    id="avatar_url"
                    name="avatar_url"
                    placeholder="https://example.com/image.jpg"
                    defaultValue={profile.avatar_url || ''}
                    onChange={(e) => setAvatarPreview(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#FFD54F]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="display_name" className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    id="display_name"
                    name="display_name"
                    defaultValue={profile.display_name || ''}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-[#FFD54F]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="bio" className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    defaultValue={profile.bio || ''}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-[#FFD54F] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-full font-bold text-sm bg-transparent border border-border text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-full font-bold text-sm bg-[#FFD54F] text-black hover:bg-[#FFE082] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
