import { createClient } from '@/utils/supabase/server'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = "force-dynamic"

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', p.id)
    .single()

  if (!profile) {
    notFound()
  }

  // Get user's watched movies count
  const { count: moviesCount } = await supabase
    .from('user_movies')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', p.id)
    .eq('status', 'completed')

  // Get user's watched shows count
  const { count: showsCount } = await supabase
    .from('user_shows')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', p.id)
    .in('status', ['watching', 'completed'])

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center px-4 h-14">
          <Link href=".." className="p-2 -ml-2 text-foreground">
            <ChevronLeft size={24} />
          </Link>
          <div className="flex-1 flex justify-center -ml-4">
            <span className="font-bold text-[15px]">{profile.display_name || 'User Profile'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center px-4 py-8">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-elevated border-2 border-border mb-4">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.display_name || 'User'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-surface-elevated text-foreground-muted">
              {(profile.display_name || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-2">{profile.display_name || 'Anonymous User'}</h1>
        
        {profile.bio && (
          <p className="text-foreground-muted text-center text-sm mb-6 max-w-sm">
            {profile.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-8 mt-4 w-full max-w-sm border-t border-b border-border py-4 justify-center">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{showsCount || 0}</span>
            <span className="text-xs text-foreground-muted font-bold tracking-widest">SHOWS</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{moviesCount || 0}</span>
            <span className="text-xs text-foreground-muted font-bold tracking-widest">MOVIES</span>
          </div>
        </div>
      </div>
    </div>
  )
}
