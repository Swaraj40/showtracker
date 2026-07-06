'use client'

import { useState } from 'react'
import { ChevronDown, MoreHorizontal, Star, Calendar, Eye, Check, X, Edit2, Heart, ListPlus, MinusSquare, Share, Play } from 'lucide-react'
import { TMDBMovieDetails } from '@/lib/tmdb'
import { motion, AnimatePresence } from 'framer-motion'
import { CharacterPoll } from '@/components/CharacterPoll'
import InterestsPoll from '@/components/InterestsPoll'
import EmotionPoll from '@/components/EmotionPoll'
import RatingPoll from '@/components/RatingPoll'
import { AddToListModal } from '@/components/AddToListModal'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

import Link from 'next/link'

import { CommentsClient } from '@/components/CommentsClient'

export function MovieClient({
  movie,
  initialStatus,
  initialIsFavorite,
  user,
  comments
}: {
  movie: TMDBMovieDetails
  initialStatus: string | null
  initialIsFavorite: boolean
  user: any
  comments: any[]
}) {
  const router = useRouter()
  const supabase = createClient()
  
  const [status, setStatus] = useState<string | null>(initialStatus)
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [activeTab, setActiveTab] = useState<'ABOUT' | 'MORE'>('ABOUT')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [justWatched, setJustWatched] = useState(false)

  // Engagement states
  const [rating, setRating] = useState<number | null>(null)
  const [feeling, setFeeling] = useState<string | null>(null)
  const [watchLocation, setWatchLocation] = useState<string | null>(null)
  const [favoriteCharacterId, setFavoriteCharacterId] = useState<number | null>(null)

  const backdropUrl = movie.backdrop_path ? (movie.backdrop_path.startsWith('http') ? movie.backdrop_path : `https://image.tmdb.org/t/p/original${movie.backdrop_path}`) : ''
  const coverPath = movie.backdrop_path ? (movie.backdrop_path.startsWith('http') ? movie.backdrop_path : `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`) : undefined

  const handleMarkWatched = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setJustWatched(true)
    setStatus('completed')
    setActiveTab('MORE') // Auto-switch to MORE tab for engagement

    if (status === 'completed') return

    // Update DB
    if (status) {
      await supabase
        .from('user_movies')
        .update({ status: 'completed' })
        .eq('movie_id', movie.id)
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('user_movies')
        .insert({
          user_id: user.id,
          movie_id: movie.id,
          status: 'completed',
          is_favorite: isFavorite
        })
    }
    router.refresh()
  }

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    const newFav = !isFavorite
    setIsFavorite(newFav)
    
    if (status) {
      await supabase
        .from('user_movies')
        .update({ is_favorite: newFav })
        .eq('movie_id', movie.id)
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('user_movies')
        .insert({
          user_id: user.id,
          movie_id: movie.id,
          status: 'watchlist',
          is_favorite: newFav
        })
      setStatus('watchlist')
    }
    router.refresh()
  }

  const handleRemove = async () => {
    if (!user) return
    setStatus(null)
    setIsFavorite(false)
    setIsMenuOpen(false)
    await supabase
      .from('user_movies')
      .delete()
      .eq('movie_id', movie.id)
      .eq('user_id', user.id)
    router.refresh()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing', err)
      }
    }
  }

  // Emojis for "How did you feel?"
  const feelings = [
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

  const ratingLabels = ['BAD', 'OK', 'GOOD', 'GREAT', 'WOW']
  const cast = movie.credits?.cast?.slice(0, 10) || []

  return (
    <div className="flex flex-col w-full bg-background min-h-screen pb-24">
      {/* Top Nav */}
      <div className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-4 py-4 pointer-events-none">
        <button onClick={() => router.back()} className="pointer-events-auto text-white drop-shadow-md">
          <ChevronDown size={28} className="rotate-90" />
        </button>
        <button onClick={() => setIsMenuOpen(true)} className="pointer-events-auto text-white drop-shadow-md">
          <MoreHorizontal size={28} />
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative w-full h-[55vh] min-h-[400px] flex flex-col justify-end">
        {backdropUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={backdropUrl} alt={movie.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-surface-elevated" />
        )}
        
        <div className="relative z-10 px-4 pb-4">
          <h1 className="text-white text-3xl font-bold mb-1">{movie.title}</h1>
          <div className="flex items-center gap-2 text-sm text-foreground-muted mb-4">
            <span>{movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : ''}</span>
            {movie.genres && movie.genres.length > 0 && (
              <>
                <span>•</span>
                <span>{movie.genres.slice(0,3).map(g => g.name).join(', ')}</span>
              </>
            )}
          </div>

          {/* Quick Action Buttons on page */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleToggleFavorite}
              className="flex-1 py-3 bg-surface-elevated text-foreground rounded-lg flex items-center justify-center gap-2 font-bold shadow-lg"
            >
              <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground'} />
              Favorite
            </button>
            <button 
              onClick={() => setIsListModalOpen(true)}
              className="flex-1 py-3 bg-surface-elevated text-foreground rounded-lg flex items-center justify-center gap-2 font-bold shadow-lg"
            >
              <ListPlus size={20} className="text-foreground" />
              Add to list
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-foreground-muted text-sm">
            <Calendar size={16} />
            <span>{movie.release_date ? new Date(movie.release_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground-muted text-sm">
            <Eye size={16} />
            <span>{status === 'completed' ? 'Watched' : 'Not watched'}</span>
          </div>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={handleMarkWatched}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-white text-black' : 'bg-surface-elevated text-foreground border border-[#333]'}`}
        >
          <Check size={20} strokeWidth={3} />
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button 
          onClick={() => setActiveTab('ABOUT')}
          className={`flex-1 py-4 text-xs font-bold tracking-widest ${activeTab === 'ABOUT' ? 'text-foreground border-b-2 border-white' : 'text-foreground-muted'}`}
        >
          ABOUT
        </button>
        <button 
          onClick={() => setActiveTab('MORE')}
          className={`flex-1 py-4 text-xs font-bold tracking-widest ${activeTab === 'MORE' ? 'text-foreground border-b-2 border-white' : 'text-foreground-muted'}`}
        >
          MORE
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'ABOUT' ? (
          <motion.div 
            key="ABOUT"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col"
          >
            {/* Where to watch */}
            <div className="px-4 py-6 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-foreground font-bold">Where to watch</h3>
              </div>
              {movie.networks && movie.networks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {movie.networks.map(n => (
                    <span key={n.id} className="px-3 py-1 bg-surface-elevated border border-border rounded-full text-xs font-bold text-foreground-muted">
                      {n.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-foreground-muted text-sm">Not available</p>
              )}
            </div>

            {/* Engagement Hook */}
            <InterestsPoll 
              itemId={movie.id} 
              itemType="movie" 
              title="WHAT INTERESTS YOU MOST ABOUT THIS MOVIE?" 
            />

            {/* Movie Info */}
            <div className="px-4 py-6 border-b border-border">
              <h3 className="text-foreground font-bold text-lg mb-4">Movie info</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-[#FFD54F] text-black font-black flex items-center justify-center rounded-sm text-xs">T</div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} className={i <= Math.round((movie.vote_average || 0) / 2) ? 'fill-[#FFD54F] text-[#FFD54F]' : 'text-foreground-muted'} />
                  ))}
                </div>
                <span className="text-foreground text-sm font-bold">{(movie.vote_average || 0).toFixed(1)}/10</span>
              </div>
              <p className="text-foreground-muted text-sm leading-relaxed mb-6">
                {movie.overview}
              </p>
              
              {/* Trailer Mock */}
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-16 bg-surface-elevated rounded-md overflow-hidden flex items-center justify-center">
                  {backdropUrl && <img src={backdropUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />}
                  <Play className="relative z-10 text-foreground fill-white" size={24} />
                </div>
                <div>
                  <div className="text-foreground font-bold text-sm">Watch trailer</div>
                  <div className="text-foreground-muted text-xs">02:21</div>
                </div>
              </div>
            </div>

            <div className="px-4 py-4 border-b border-border">
              <div className="flex items-center gap-2 text-foreground-muted text-sm">
                <Eye size={16} />
                <span>686 added this movie</span>
              </div>
            </div>

            {/* Cast */}
            {cast.length > 0 && (
              <div className="py-6 border-b border-border">
                <h3 className="text-foreground font-bold text-lg px-4 mb-4">Cast</h3>
                <div className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory hide-scrollbar">
                  {cast.map((c: any) => (
                    <div key={c.id} className="flex-shrink-0 w-24 snap-start">
                      <div className="w-24 h-36 bg-surface-elevated rounded-md mb-2 overflow-hidden">
                        {c.profile_path && <img src={c.profile_path} alt={c.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="text-foreground text-sm truncate">{c.name}</div>
                      <div className="text-foreground-muted text-xs uppercase truncate">{c.character}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link href={`/movies/${movie.id}/comments`} className="block">
              <div className="px-4 py-6 mb-20 flex items-center justify-between border-b border-border hover:bg-white/5 transition-colors cursor-pointer">
                <h3 className="text-foreground font-bold text-lg">Comments</h3>
                <div className="flex items-center gap-1 text-foreground">
                  <span>{comments.length}</span>
                  <ChevronDown size={16} className="-rotate-90" />
                </div>
              </div>
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            key="MORE"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col pb-32"
          >
            {/* Where did you watch? */}
            <div className="px-4 py-8 border-b border-border">
              <h3 className="text-foreground-muted text-xs font-bold tracking-widest text-center mb-6">WHERE DID YOU WATCH?</h3>
              <div className="flex justify-center gap-4">
                {['THEATER', 'OTHER', 'UNOFFICIAL'].map(loc => (
                  <button 
                    key={loc}
                    onClick={() => setWatchLocation(loc)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${watchLocation === loc ? 'bg-surface-elevated' : 'bg-surface-elevated'}`}>
                      {loc === 'THEATER' ? <div className="w-8 h-6 bg-[#FFD54F]" /> : 
                       loc === 'OTHER' ? <MoreHorizontal size={32} className="text-foreground-muted" /> : 
                       <div className="w-8 h-8 rounded-full border-4 border-red-500 relative"><div className="absolute top-1 right-0 w-3 h-1 bg-red-500 rotate-45" /></div>}
                    </div>
                    <span className="text-foreground-muted text-xs font-bold">{loc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rate this movie */}
            <RatingPoll itemId={movie.id} itemType="movie" />

            {/* How did you feel */}
            <EmotionPoll itemId={movie.id} itemType="movie" />

            {/* Who was your favorite */}
            {cast.length > 0 && (
              <div className="px-4 py-8">
                <h3 className="text-foreground-muted text-xs font-bold tracking-widest text-center mb-6">WHO WAS YOUR FAVORITE?</h3>
                <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory hide-scrollbar">
                  {cast.map((c: any) => (
                    <button 
                      key={c.id} 
                      onClick={() => setFavoriteCharacterId(c.id)}
                      className="flex-shrink-0 w-20 snap-start flex flex-col items-center gap-2"
                    >
                      <div className={`w-20 h-24 rounded-md overflow-hidden ${favoriteCharacterId === c.id ? 'ring-2 ring-white' : ''}`}>
                        {c.profile_path ? <img src={c.profile_path} alt={c.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-surface-elevated" />}
                      </div>
                      <div className="text-foreground-muted text-[10px] font-bold uppercase truncate w-full text-center">{c.character.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            
            {/* Comments Section */}
            <div className="border-t border-border mt-4 pt-4">
              <h3 className="text-foreground-muted text-xs font-bold tracking-widest text-center mb-6">COMMENTS</h3>
              <CommentsClient 
                mediaId={movie.id}
                mediaType="movie"
                mediaTitle={movie.title}
                comments={comments}
                isLoggedIn={!!user}
                hideHeader={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <span className="text-foreground-muted text-sm">{status === 'completed' ? 'Watched' : 'Not watched'}</span>
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
                <span className="text-lg">Remove movie</span>
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
          itemId={movie.id}
          mediaType="movie"
          coverPath={coverPath}
        />
      )}
    </div>
  )
}
