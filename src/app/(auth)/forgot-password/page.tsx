import { resetPasswordForEmail } from '../actions'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams;
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mt-20">
      <form className="flex-1 flex flex-col w-full justify-center gap-2">
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        <p className="text-gray-300 mb-6 text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-xl px-4 py-3 bg-white/10 border border-white/20 mb-6 text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFD54F] transition-colors"
          name="email"
          placeholder="you@example.com"
          required
        />
        <button
          formAction={resetPasswordForEmail}
          className="bg-[#FFD54F] rounded-xl px-4 py-3 text-black font-bold mb-2 hover:bg-[#FFC107] transition-colors active:scale-[0.98]"
        >
          SEND RESET LINK
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
          Remembered your password?{' '}
          <a href="/login" className="text-blue-500 hover:underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  )
}
