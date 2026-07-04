export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 w-full">
      <div className="w-12 h-12 rounded-full border-4 border-gray-800 border-t-[#FFD54F] animate-spin"></div>
      <p className="text-gray-400 font-bold tracking-widest text-sm animate-pulse">LOADING MOVIES...</p>
    </div>
  )
}
