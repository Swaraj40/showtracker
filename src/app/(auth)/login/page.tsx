import { login } from '../actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams;
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <form className="flex-1 flex flex-col w-full justify-center gap-2">
        <h1 className="text-2xl font-bold mb-4">Sign In</h1>
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-xl px-4 py-3 bg-white/10 border border-white/20 mb-6 text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFD54F] transition-colors"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-md" htmlFor="password">
          Password
        </label>
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
