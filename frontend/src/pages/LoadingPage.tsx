export default function LoadingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-900 text-white gap-6">
      {/* Spinner */}
      <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin" />

      {/* Texto */}
      <div className="text-2xl font-semibold tracking-wide">
        A carregar o jogo...
      </div>
    </div>
  )
}