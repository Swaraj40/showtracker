'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Check, AlertCircle } from 'lucide-react'
import { updateProfile, checkUsername } from './actions'
import { createClient } from '@/utils/supabase/client'

type EditProfileModalProps = {
  isOpen: boolean
  onClose: () => void
  profile: {
    display_name: string | null
    bio: string | null
    avatar_url: string | null
    username: string | null
  }
}

export function EditProfileModal({ isOpen, onClose, profile }: EditProfileModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || '')
  
  const [username, setUsername] = useState(profile.username || '')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  
  // Debounce timeout ref
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen) {
      setAvatarPreview(profile.avatar_url || '')
      setUsername(profile.username || '')
      setUsernameAvailable(null)
      setError('')
    }
  }, [isOpen, profile.avatar_url, profile.username])

  const [suggestions, setSuggestions] = useState<string[]>([])
  
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // allow symbols, but no spaces, and convert to lowercase
    const val = e.target.value.toLowerCase().replace(/\s/g, '')
    setUsername(val)
    setSuggestions([])
    
    if (val === profile.username) {
      setUsernameAvailable(null)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      return
    }

    if (val.length < 4 || val.length > 12) {
      setUsernameAvailable(false)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      return
    }

    setIsCheckingUsername(true)
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      try {
        const result = await checkUsername(val)
        setUsernameAvailable(result.available)
        if (result.suggestions) {
          setSuggestions(result.suggestions)
        }
      } catch (err) {
        setUsernameAvailable(null)
      } finally {
        setIsCheckingUsername(false)
      }
    }, 500)
  }

  async function handleSubmit(formData: FormData) {
    if (usernameAvailable === false && username !== profile.username) {
      setError('Username is not available')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    try {
      formData.set('username', username)
      // Make sure we submit the uploaded avatar preview if it changed
      if (avatarPreview) {
        formData.set('avatar_url', avatarPreview)
      }
      await updateProfile(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    const file = e.target.files[0]
    setIsUploading(true)
    setError('')

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarPreview(publicUrl)
    } catch (err: any) {
      setError(err.message || 'Error uploading image')
    } finally {
      setIsUploading(false)
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
                  <div className="relative group cursor-pointer">
                    <label htmlFor="avatar_upload" className="cursor-pointer relative block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={avatarPreview || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                        alt="Avatar Preview" 
                        className={`w-24 h-24 rounded-full border-2 border-border object-cover bg-background ${isUploading ? 'opacity-50' : 'group-hover:opacity-75 transition-opacity'}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {isUploading ? (
                          <div className="w-8 h-8 border-4 border-[#FFD54F] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={32} />
                        )}
                      </div>
                    </label>
                    <input
                      type="file"
                      id="avatar_upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 hidden">
                  <label htmlFor="avatar_url" className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Profile Picture URL</label>
                  <input
                    type="url"
                    id="avatar_url"
                    name="avatar_url"
                    placeholder="https://example.com/image.jpg"
                    value={avatarPreview}
                    readOnly
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

                <div className="flex flex-col gap-1 relative">
                  <label htmlFor="username" className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-foreground-muted font-bold">@</span>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={username}
                      onChange={handleUsernameChange}
                      className="w-full bg-background border border-border rounded-md pl-8 pr-10 py-2 text-foreground focus:outline-none focus:border-[#FFD54F]"
                    />
                    <div className="absolute right-3 top-2.5">
                      {isCheckingUsername ? (
                        <div className="w-4 h-4 border-2 border-[#FFD54F] border-t-transparent rounded-full animate-spin" />
                      ) : usernameAvailable === true ? (
                        <Check size={18} className="text-green-500" />
                      ) : usernameAvailable === false ? (
                        <AlertCircle size={18} className="text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  {usernameAvailable === false && (
                    <div className="flex flex-col gap-2 mt-1">
                      <p className="text-xs text-red-500">
                        {username.length < 4 || username.length > 12 
                          ? 'Username must be between 4 and 12 characters.' 
                          : 'Username is not available.'}
                      </p>
                      {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs text-foreground-muted w-full">Suggestions:</span>
                          {suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setUsername(suggestion)
                                setUsernameAvailable(true)
                                setSuggestions([])
                              }}
                              className="text-xs bg-surface-elevated hover:bg-surface-hover text-foreground px-2 py-1 rounded-md transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
                    disabled={isSubmitting || usernameAvailable === false}
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
