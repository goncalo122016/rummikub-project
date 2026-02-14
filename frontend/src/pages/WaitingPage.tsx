import { colorFromName } from "../utils/playerColor"
import { LogOut, Clock} from "lucide-react"
import StarfieldBackground from "../components/StarfieldBackground"

interface WaitingPageProps {
  players: string[]
  maxPlayers: number
  onLeave?: () => void
}

export default function WaitingPage({
  players,
  maxPlayers,
  onLeave,
}: WaitingPageProps) {
  const slotsLeft = maxPlayers - players.length

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-900 via-green-800 to-green-900 relative overflow-hidden px-4">
      <StarfieldBackground />

      <div className="bg-green-800/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md text-white relative border border-green-700/30 z-10">
        <button
          onClick={onLeave}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg hover:bg-red-500/30 hover:border-red-400/50 transition-all duration-200 text-sm font-medium cursor-pointer"
          title="Sair da sala"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>

        <div className="text-center space-y-2 mt-2 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">
            Sala de Espera
          </h2>
          <p className="text-green-200 text-sm flex items-center justify-center gap-2">
            <Clock size={16} className="animate-pulse" />
            A aguardar que os jogadores entrem…
          </p>
        </div>

        <div className="mb-6 bg-green-900/30 rounded-lg p-4 border border-green-700/30">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Jogadores</span>
            <span className="font-bold text-green-300">
              {players.length} / {maxPlayers}
            </span>
          </div>

          <div className="w-full bg-green-700/50 rounded-full h-3 overflow-hidden border border-green-600/50">
            <div
              className="bg-linear-to-r from-green-400 to-green-500 h-full transition-all duration-500 shadow-lg"
              style={{
                width: `${(players.length / maxPlayers) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="space-y-2 md:space-y-3 mb-6">
          {players.map(p => {
            const color = colorFromName(p)

            return (
              <div
                key={p}
                className="flex items-center gap-3 bg-green-700/50 backdrop-blur-sm rounded-lg px-4 py-2.5 md:py-3 border border-green-600/30 shadow-md"
              >
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-white ${color} shadow-lg`}
                >
                  {p[0].toUpperCase()}
                </div>
                <span className="font-semibold text-sm md:text-base">{p}</span>
              </div>
            )
          })}

          {Array.from({ length: slotsLeft }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 bg-green-700/20 backdrop-blur-sm rounded-lg px-4 py-2.5 md:py-3 text-green-300 italic border border-green-600/20"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-green-600/30 flex items-center justify-center text-lg border-2 border-dashed border-green-500/30">
                ?
              </div>
              <span className="text-sm md:text-base">A aguardar jogador…</span>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-green-300 animate-pulse flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
          O jogo irá começar automaticamente
        </div>
      </div>
    </div>
  )
}