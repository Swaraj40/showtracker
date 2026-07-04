import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/(auth)/actions'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col gap-8 pt-8 px-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      
      {user ? (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-[#1E1E1E] rounded-xl">
            <p className="text-sm text-gray-400">Logged in as</p>
            <p className="font-bold">{user.email}</p>
          </div>
          
          <form action={logout}>
            <button className="w-full py-3 bg-red-900/30 text-red-400 font-bold rounded-xl border border-red-900/50">
              Log Out
            </button>
          </form>
        </div>
      ) : (
        <a href="/login" className="w-full flex items-center justify-center gap-2 py-3 bg-[#FFD54F] text-black rounded-xl font-bold">
          Log in
        </a>
      )}
    </div>
  )
}
