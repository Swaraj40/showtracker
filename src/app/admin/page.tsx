export const dynamic = "force-dynamic"

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function AdminPage() {
  const supabase = await createClient()
  
  // Get users count
  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get total tracked shows count
  const { count: trackedCount } = await supabase
    .from('user_shows')
    .select('*', { count: 'exact', head: true })

  // Get config
  const { data: configRows } = await supabase.from('app_config').select('*')
  const announcementConfig = configRows?.find(c => c.key === 'announcement')

  async function updateConfig(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const text = formData.get('announcement_text') as string
    
    await supabase.from('app_config').upsert({
      key: 'announcement',
      value: { text, active: !!text }
    })
    
    revalidatePath('/admin')
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 mb-2">Total Users</h3>
          <p className="text-4xl font-black">{usersCount || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="text-gray-500 mb-2">Total Tracked Shows</h3>
          <p className="text-4xl font-black">{trackedCount || 0}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-bold mb-4">App Configuration</h2>
        
        <form action={updateConfig} className="flex flex-col gap-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Announcement Banner Text</label>
            <input 
              name="announcement_text"
              defaultValue={announcementConfig?.value?.text || ''}
              className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
              placeholder="Leave blank to disable"
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 w-fit">
            Save Configuration
          </button>
        </form>
      </div>
    </div>
  )
}
