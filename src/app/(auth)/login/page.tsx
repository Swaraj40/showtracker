import { login } from '../actions'
import { OAuthButtons } from '@/components/OAuthButtons'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams;
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mt-12">
      <OAuthButtons />
      
      <form className="flex-1 flex flex-col w-full justify-center gap-2">
        <label className="text-md mt-4" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-xl px-4 py-3 bg-white/10 border border-white/20 mb-4 text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFD54F] transition-colors"
          name="email"
          placeholder="you@example.com"
          required
        />
        <div className="flex justify-between items-center">
          <label className="text-md" htmlFor="password">
            Password
          </label>
          <a href="/forgot-password" className="text-xs text-blue-400 hover:underline">
            Forgot password?
          </a>
        </div>
        <input
          className="rounded-xl px-4 py-3 bg-white/10 border border-white/20 mb-6 text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFD54F] transition-colors"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <button
          formAction={login}
          className="bg-[#FFD54F] rounded-xl px-4 py-3 text-black font-bold mb-2 hover:bg-[#FFC107] transition-colors active:scale-[0.98]"
        >
          LOG IN
        </button>
        {params?.message && (
          <p className={`mt-4 p-4 text-center rounded-md ${
            params.message.includes('email') 
              ? 'bg-green-900/50 text-green-300' 
              : 'bg-red-900/50 text-red-300'
          }`}>
            {params.message}
          </p>
        )}
        <p className="text-sm text-center mt-4 text-gray-300">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-500 hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  )
}
