import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationsClient } from './NotificationsClient'

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:profiles!actor_id (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return <NotificationsClient initialNotifications={notifications || []} />
}
