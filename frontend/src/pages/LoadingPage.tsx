import StarfieldBackground from "../components/StarfieldBackground"

export default function LoadingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-green-900 via-green-800 to-green-900 text-white gap-6 relative overflow-hidden">
      <StarfieldBackground />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin" />

        <div className="text-2xl font-semibold tracking-wide">
          A carregar o jogo...
        </div>
      </div>
    </div>
  )
}