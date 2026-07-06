import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-surface-elevated text-gray-900 dark:text-foreground flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-4">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <nav className="flex flex-col gap-2">
          <Link href="/admin" className="hover:bg-gray-100 dark:hover:bg-surface-elevated p-2 rounded">Dashboard</Link>
          <Link href="/" className="hover:bg-gray-100 dark:hover:bg-surface-elevated p-2 rounded text-blue-500">Back to App</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
