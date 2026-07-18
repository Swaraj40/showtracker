'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, Check, Heart, MessageCircle, Tv, Film } from 'lucide-react'
import { markNotificationRead, markAllNotificationsRead } from '@/app/(main)/actions/social'

type Notification = {
  id: string
  type: string
  read: boolean
  created_at: string
  metadata?: any
  actor?: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

export function NotificationsClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const router = useRouter()

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await markNotificationRead(id)
  }

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await markAllNotificationsRead()
  }

  const getNotificationContent = (n: Notification) => {
    const actorName = n.actor?.display_name || n.actor?.username || 'Someone'
    
    switch (n.type) {
      case 'follow':
        return {
          icon: <Bell size={18} className="text-blue-400" />,
          text: <><span className="font-bold">{actorName}</span> started following you.</>,
          link: `/u/${n.actor?.username || ''}`
        }
      case 'like':
        const likeLink = n.metadata?.media_id 
          ? (n.metadata.media_type === 'movie' ? `/movies/${n.metadata.media_id}/comments` : `/show/${n.metadata.media_id}/comments`)
          : '#'
        return {
          icon: <Heart size={18} className="text-red-500 fill-current" />,
          text: <><span className="font-bold">{actorName}</span> liked your comment.</>,
          link: likeLink
        }
      case 'reply':
        const replyLink = n.metadata?.media_id 
          ? (n.metadata.media_type === 'movie' ? `/movies/${n.metadata.media_id}/comments` : `/show/${n.metadata.media_id}/comments`)
          : '#'
        return {
          icon: <MessageCircle size={18} className="text-green-400 fill-current" />,
          text: <><span className="font-bold">{actorName}</span> replied to your comment.</>,
          link: replyLink
        }
      case 'new_episode':
        return {
          icon: <Tv size={18} className="text-purple-400" />,
          text: <>New episode of <span className="font-bold">{n.metadata?.title || 'a show'}</span> is now available!</>,
          link: n.metadata?.show_id ? `/show/${n.metadata.show_id}` : '#'
        }
      case 'movie_release':
        return {
          icon: <Film size={18} className="text-orange-400" />,
          text: <><span className="font-bold">{n.metadata?.title || 'A movie'}</span> is releasing today!</>,
          link: n.metadata?.movie_id ? `/movies/${n.metadata.movie_id}` : '#'
        }
      default:
        return {
          icon: <Bell size={18} />,
          text: <span>You have a new notification.</span>,
          link: '#'
        }
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <h1 className="font-bold text-lg">Notifications {unreadCount > 0 && <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full ml-2">{unreadCount}</span>}</h1>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-xs font-bold text-[#FFD54F] hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20 px-4 text-center opacity-50">
          <Bell size={48} className="mb-4" />
          <h3 className="text-xl font-bold">All caught up!</h3>
          <p className="text-sm mt-2">You don't have any notifications right now.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {notifications.map(notification => {
            const content = getNotificationContent(notification)
            return (
              <Link 
                key={notification.id} 
                href={content.link}
                onClick={() => {
                  if (!notification.read) {
                    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n))
                    markNotificationRead(notification.id)
                  }
                }}
                className={`flex gap-4 p-4 transition-colors hover:bg-surface-elevated ${!notification.read ? 'bg-surface-elevated/50' : ''}`}
              >
                <div className="mt-1 flex-shrink-0">
                  {content.icon}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <p className="text-sm text-foreground leading-tight">{content.text}</p>
                  <span className="text-xs text-foreground-muted">
                    {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                  </span>
                </div>
                {!notification.read && (
                  <button 
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                    className="flex-shrink-0 p-2 text-foreground-muted hover:text-white"
                  >
                    <Check size={16} />
                  </button>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
