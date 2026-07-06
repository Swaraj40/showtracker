'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export function OAuthButtons() {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      console.error(`${provider} login error:`, error)
      alert(`Could not authenticate with ${provider}`)
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <button
        onClick={() => handleOAuthLogin('google')}
        disabled={loading !== null}
        className="flex items-center justify-center gap-3 bg-white text-black rounded-xl px-4 py-3 font-bold hover:bg-gray-100 transition-colors active:scale-[0.98] disabled:opacity-50"
      >
        {loading === 'google' ? (
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Continue with Google
      </button>

      <button
        onClick={() => handleOAuthLogin('apple')}
        disabled={loading !== null}
        className="flex items-center justify-center gap-3 bg-black text-white border border-white/20 rounded-xl px-4 py-3 font-bold hover:bg-gray-900 transition-colors active:scale-[0.98] disabled:opacity-50"
      >
        {loading === 'apple' ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.365 21.43c-1.332 1.396-2.736 1.344-4.062.662-1.282-.662-2.766-.662-4.08 0-1.348.69-2.637.77-3.953-.615C1.196 18.232-.423 11.536 2.456 6.552 3.864 4.1 6.223 2.593 8.847 2.56c1.32-.036 2.628.878 3.472.878.844 0 2.46-1.127 4.093-.956 1.706.07 3.253.714 4.225 1.956-3.398 2.023-2.88 6.702.395 8.007-.798 2.102-1.745 4.316-3.23 6.37-1.042 1.455-2.184 2.924-3.468 2.98h.03zM15.46 2.372c-.812 1.01-1.996 1.696-3.11 1.636-.212-1.203.35-2.45 1.135-3.218C14.364-.108 15.65-.436 16.716.32c.188 1.144-.413 2.316-1.256 3.052z" />
          </svg>
        )}
        Continue with Apple
      </button>

      <div className="flex items-center gap-4 my-2 opacity-50">
        <div className="flex-1 h-px bg-white/20" />
        <span className="text-xs font-bold tracking-widest">OR</span>
        <div className="flex-1 h-px bg-white/20" />
      </div>
    </div>
  )
}
