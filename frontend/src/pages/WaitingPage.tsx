import { colorFromName } from "../utils/playerColor"

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
    <div className="min-h-screen flex items-center justify-center bg-green-900 px-4">
      <div className="bg-green-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-white">
        <button
          onClick={onLeave}
          className="mb-4 px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
        >
          Sair da sala
        </button>

        <h2 className="text-2xl font-bold text-center mb-2">
          Sala de Espera
        </h2>

        <p className="text-center text-green-200 mb-6">
          A aguardar que os jogadores entrem…
        </p>

        {/* Progresso */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Jogadores</span>
            <span>
              {players.length} / {maxPlayers}
            </span>
          </div>

          <div className="w-full bg-green-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-400 h-full transition-all duration-500"
              style={{
                width: `${(players.length / maxPlayers) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Player list */}
        <div className="space-y-2 mb-6">
          {players.map(p => {
            const color = colorFromName(p)

            return (
              <div
                key={p}
                className="flex items-center gap-3 bg-green-700/70 rounded-lg px-4 py-2"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${color}`}
                >
                  {p[0].toUpperCase()}
                </div>
                <span className="font-medium">{p}</span>
              </div>
            )
          })}

          {/* Lugares vazios */}
          {Array.from({ length: slotsLeft }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 bg-green-700/30 rounded-lg px-4 py-2 text-green-300 italic"
            >
              <div className="w-8 h-8 rounded-full bg-green-600/40 flex items-center justify-center">
                ?
              </div>
              A aguardar jogador…
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-green-300 animate-pulse">
          O jogo irá começar automaticamente
        </div>
      </div>
    </div>
  )
}
