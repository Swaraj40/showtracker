import { updatePassword } from '../actions'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams;
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mt-20">
      <form className="flex-1 flex flex-col w-full justify-center gap-2">
        <h1 className="text-2xl font-bold mb-4">Set New Password</h1>
        <p className="text-gray-300 mb-6 text-sm">
          Please enter your new password below.
        </p>
        <label className="text-md" htmlFor="password">
          New Password
        </label>
        <input
          className="rounded-xl px-4 py-3 bg-white/10 border border-white/20 mb-6 text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFD54F] transition-colors"
          name="password"
          type="password"
          placeholder="••••••••"
          required
        />
        <button
          formAction={updatePassword}
          className="bg-[#FFD54F] rounded-xl px-4 py-3 text-black font-bold mb-2 hover:bg-[#FFC107] transition-colors active:scale-[0.98]"
        >
          UPDATE PASSWORD
        </button>
        {params?.message && (
          <p className={`mt-4 p-4 text-center rounded-md bg-red-900/50 text-red-300`}>
            {params.message}
          </p>
        )}
      </form>
    </div>
  )
}
