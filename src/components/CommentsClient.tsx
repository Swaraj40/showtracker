'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MessageSquare, Star, Edit3, Heart, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { WriteCommentModal } from './WriteCommentModal'
import { likeComment, unlikeComment, postReply } from '@/app/(main)/actions/social'

type CommentType = {
  id: string
  content: string
  rating?: number
  photo_url?: string
  created_at: string
  user_id: string
  parent_id: string | null
  profiles: {
    display_name: string | null
    avatar_url: string | null
    username: string | null
  }
  likes_count: number
  user_liked: boolean
}

function CommentItem({
  comment,
  replies,
  isLoggedIn,
  currentUserId,
  onReply
}: {
  comment: CommentType
  replies: CommentType[]
  isLoggedIn: boolean
  currentUserId?: string
  onReply: (parentId: string) => void
}) {
  const router = useRouter()
  const [liked, setLiked] = useState(comment.user_liked)
  const [likeCount, setLikeCount] = useState(comment.likes_count)
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async () => {
    if (!isLoggedIn) return router.push('/login')
    if (isLiking) return
    
    setIsLiking(true)
    const newLikedState = !liked
    setLiked(newLikedState)
    setLikeCount(c => newLikedState ? c + 1 : c - 1)

    try {
      if (newLikedState) {
        await likeComment(comment.id)
      } else {
        await unlikeComment(comment.id)
      }
    } catch (e) {
      // Revert on error
      setLiked(!newLikedState)
      setLikeCount(c => !newLikedState ? c + 1 : c - 1)
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <Link href={`/u/${comment.profiles?.username || comment.user_id}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-elevated">
            {comment.profiles?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={comment.profiles.avatar_url} alt={comment.profiles.display_name || comment.profiles.username || 'User'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-elevated text-foreground font-bold">
                {(comment.profiles?.display_name || comment.profiles?.username || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm group-hover:underline">{comment.profiles?.display_name || (comment.profiles?.username ? `@${comment.profiles.username}` : 'Anonymous User')}</span>
              {comment.profiles?.username && comment.profiles?.display_name && (
                <span className="text-xs text-foreground-muted font-medium">@{comment.profiles.username}</span>
              )}
            </div>
            <span className="text-xs text-foreground-muted">
              {new Date(comment.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </Link>
        {comment.rating && (
          <div className="flex items-center gap-1 bg-surface-elevated px-2 py-1 rounded-md">
            <Star size={12} className="fill-[#FFD54F] text-[#FFD54F]" />
            <span className="text-xs font-bold">{comment.rating}</span>
          </div>
        )}
      </div>

      <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
        {comment.content}
      </p>

      {comment.photo_url && (
        <div className="mt-2 rounded-xl overflow-hidden max-h-64 border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={comment.photo_url} alt="User upload" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-6 mt-1 text-foreground-muted">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs font-medium hover:text-white transition-colors ${liked ? 'text-red-500 hover:text-red-400' : ''}`}
        >
          <Heart size={16} className={liked ? 'fill-current' : ''} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button 
          onClick={() => onReply(comment.id)}
          className="flex items-center gap-1.5 text-xs font-medium hover:text-white transition-colors"
        >
          <MessageCircle size={16} />
          <span>Reply</span>
        </button>
      </div>

      {/* Replies */}
      {replies && replies.length > 0 && (
        <div className="flex flex-col gap-4 mt-2 ml-4 pl-4 border-l border-border/50">
          {replies.map(reply => (
            <CommentItem 
              key={reply.id}
              comment={reply}
              replies={[]} // We don't support deeper nesting in this design
              isLoggedIn={isLoggedIn}
              currentUserId={currentUserId}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentsClient({
  mediaId,
  mediaType,
  mediaTitle,
  comments,
  isLoggedIn,
  currentUserId,
  hideHeader = false
}: {
  mediaId: number
  mediaType: 'movie' | 'show'
  mediaTitle: string
  comments: any[]
  isLoggedIn: boolean
  currentUserId?: string
  hideHeader?: boolean
}) {
  const router = useRouter()
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  const handleOpenWriteModal = () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    setIsWriteModalOpen(true)
  }

  const handleReplyClick = (parentId: string) => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    // Toggle reply box
    setReplyingToId(prev => prev === parentId ? null : parentId)
    setReplyContent('')
  }

  const submitReply = async () => {
    if (!replyingToId || !replyContent.trim()) return
    setIsSubmittingReply(true)
    try {
      await postReply(replyingToId, mediaId, mediaType, replyContent)
      setReplyingToId(null)
      setReplyContent('')
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmittingReply(false)
    }
  }

  // Group comments
  const topLevelComments = comments.filter(c => !c.parent_id)
  const replies = comments.filter(c => c.parent_id)

  const getRepliesForComment = (parentId: string) => {
    return replies.filter(r => r.parent_id === parentId)
  }

  return (
    <div className={`flex flex-col text-foreground relative ${hideHeader ? 'pb-8' : 'min-h-screen bg-background pb-24'}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
          <div className="flex items-center px-4 h-14">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-foreground">
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 flex flex-col -ml-4">
              <span className="text-center font-bold text-[15px] truncate px-8">{mediaTitle}</span>
              <span className="text-center text-[11px] text-foreground-muted">COMMENTS</span>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="flex-1 flex flex-col">
        {topLevelComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 px-4 text-center">
            <MessageSquare size={48} className="text-foreground-muted mb-4" />
            <h3 className="text-xl font-bold mb-2">No comments yet</h3>
            <p className="text-foreground-muted text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#222]">
            {topLevelComments.map((comment) => (
              <div key={comment.id} id={`comment-${comment.id}`} className="p-4 flex flex-col">
                <CommentItem
                  comment={comment}
                  replies={getRepliesForComment(comment.id)}
                  isLoggedIn={isLoggedIn}
                  currentUserId={currentUserId}
                  onReply={handleReplyClick}
                />
                
                {/* Inline Reply Box */}
                {replyingToId === comment.id && (
                  <div className="mt-4 ml-4 pl-4 border-l border-border/50 flex flex-col gap-2">
                    <textarea 
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full bg-surface-elevated text-foreground text-sm rounded-lg p-3 outline-none resize-none min-h-[80px]"
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setReplyingToId(null)}
                        className="text-xs font-bold text-foreground-muted px-4 py-2 hover:bg-surface-elevated rounded-full"
                      >
                        CANCEL
                      </button>
                      <button 
                        onClick={submitReply}
                        disabled={isSubmittingReply || !replyContent.trim()}
                        className="text-xs font-bold bg-[#FFD54F] text-black px-4 py-2 rounded-full disabled:opacity-50"
                      >
                        {isSubmittingReply ? 'POSTING...' : 'REPLY'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (Only when not embedded) */}
      {!hideHeader && (
        <button 
          onClick={handleOpenWriteModal}
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#FFD54F] text-black rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
        >
          <Edit3 size={24} />
        </button>
      )}

      {/* Inline Action Button (Only when embedded) */}
      {hideHeader && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={handleOpenWriteModal}
            className="flex items-center gap-2 bg-[#FFD54F] text-black px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            <Edit3 size={20} />
            <span>Write a Comment</span>
          </button>
        </div>
      )}

      {/* Write Comment Modal */}
      <WriteCommentModal 
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        mediaId={mediaId}
        mediaType={mediaType}
      />
    </div>
  )
}
