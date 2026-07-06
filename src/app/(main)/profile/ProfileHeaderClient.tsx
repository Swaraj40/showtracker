'use client'

import { useState, useRef, useEffect } from 'react'
import { EditProfileModal } from './EditProfileModal'
import { Bell, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

type Profile = {
  display_name: string | null
  bio: string | null
  avatar_url: string | null
}

export function ProfileHeaderClient({ 
  profile, 
  userEmail, 
  backdropUrl,
  isOwner = true
}: { 
  profile: Profile | null, 
  userEmail: string,
  backdropUrl: string,
  isOwner?: boolean
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const displayName = profile?.display_name || userEmail.split('@')[0]
  const avatarUrl = profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <div className="relative w-full h-[40vh] min-h-[300px] bg-background">
        {/* Banner Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={backdropUrl || 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1000'}
          alt="Cover"
          className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[10%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent h-24" />

        {/* Top Icons */}
        {isOwner && (
          <div className="absolute top-4 left-4 z-10">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Bell size={20} className="text-black fill-black" />
            </div>
          </div>
        )}
        
        <div className="absolute top-4 right-4 z-20" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white flex items-center justify-center w-10 h-10 hover:bg-background/20 rounded-full transition-colors"
          >
            <MoreHorizontal size={28} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-12 right-0 w-48 bg-surface border border-surface-hover rounded-md shadow-2xl overflow-hidden py-1">
              {isOwner && (
                <Link 
                  href="/profile/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-sm text-foreground hover:bg-surface-hover font-medium transition-colors"
                >
                  View settings
                </Link>
              )}
              <button 
                onClick={() => {
                  setIsMenuOpen(false)
                  alert("Share feature coming soon!")
                }}
                className="block w-full text-left px-4 py-3 text-sm text-foreground hover:bg-surface-hover font-medium transition-colors"
              >
                Share
              </button>
              <button 
                onClick={() => {
                  setIsMenuOpen(false)
                  alert("Help Center coming soon!")
                }}
                className="block w-full text-left px-4 py-3 text-sm text-foreground hover:bg-surface-hover font-medium transition-colors"
              >
                Help Center
              </button>
            </div>
          )}
        </div>
        
        {/* Profile Info */}
        <div className="absolute bottom-6 left-4 flex items-center gap-4 z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            className="w-20 h-20 rounded-full border-[1.5px] border-white object-cover bg-surface shadow-xl"
          />
          <div className="flex flex-col">
            <span className="text-[22px] font-bold text-white drop-shadow-lg tracking-wide">{displayName}</span>
            {isOwner && (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="text-[11px] font-bold border border-white rounded-full px-5 py-1 mt-1 w-fit uppercase text-white hover:bg-white hover:text-black transition-colors shadow-sm"
              >
                EDIT
              </button>
            )}
          </div>
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile || { display_name: null, bio: null, avatar_url: null }}
      />
    </>
  )
}
