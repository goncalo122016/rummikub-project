import { useState } from "react"
import { ArrowLeft, Play, Settings, Users } from "lucide-react"
import StarfieldBackground from "../components/StarfieldBackground"

interface CreateGameData {
  name: string | null
  numPlayers: number
  rules: {
    mode: "classic" | "custom"
    totalTiles?: number
    jokers?: number
    tilesPerPlayer?: number
  }
}

interface Props {
  name: string | null
  onCreate: (data: CreateGameData) => void
  onBack: () => void
}

export default function CreateGamePage({ name, onCreate, onBack }: Props) {
  const [numPlayers, setNumPlayers] = useState(2)
  const [rulesMode, setRulesMode] = useState<"classic" | "custom">("classic")

  const [totalTiles, setTotalTiles] = useState(106)
  const [jokers, setJokers] = useState(2)
  const [tilesPerPlayer, setTilesPerPlayer] = useState(14)

  const [error, setError] = useState<string | null>(null)

  function handleCreate() {
    setError(null)

    if (numPlayers < 2 ) {
      setError("Número de jogadores deve ser pelo menos 2")
      return
    }

    if (rulesMode === "custom") {
      if (tilesPerPlayer < 3) {
        setError("Peças por jogador deve ser pelo menos 3")
        return
      }

      if (jokers < 0) {
        setError("Número de jokers não pode ser negativo")
        return
      }

      if (totalTiles < numPlayers * tilesPerPlayer) {
        setError("Peças totais insuficientes para o número de jogadores")
        return
      }
    }

    onCreate({
      name,
      numPlayers,
      rules: {
        mode: rulesMode,
        ...(rulesMode === "custom" && {
          totalTiles,
          jokers,
          tilesPerPlayer
        })
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-900 via-green-800 to-green-900 relative overflow-hidden p-4">
      <StarfieldBackground />

      <div className="bg-neutral-900/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl w-full max-w-md space-y-6 shadow-2xl border border-white/10 relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-white flex-1">
            Criar Jogo
          </h1>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-3 text-center border border-neutral-700">
          <span className="text-sm text-gray-400">Jogador: </span>
          <span className="text-white font-semibold">{name}</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Users size={16} />
            Número de Jogadores
          </label>
          <input
            type="number"
            min={2}
            max={4}
            className="w-full p-3 rounded-lg bg-neutral-800 text-white border-2 border-transparent focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
            value={numPlayers}
            onChange={e => setNumPlayers(Number(e.target.value))}
          />
        </div>

        {/* Rules selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Settings size={16} />
            Modo de Jogo
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                rulesMode === "classic"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
              }`}
              onClick={() => setRulesMode("classic")}
            >
              Clássico
            </button>

            <button
              className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                rulesMode === "custom"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
              }`}
              onClick={() => setRulesMode("custom")}
            >
              Personalizado
            </button>
          </div>
        </div>

        {/* Custom rules */}
        {rulesMode === "custom" && (
          <div className="space-y-4 bg-neutral-800/30 p-4 rounded-lg border border-neutral-700">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Total de Peças
              </label>
              <input
                type="number"
                className="w-full p-3 rounded-lg bg-neutral-800 text-white border-2 border-transparent focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
                value={totalTiles}
                onChange={e => setTotalTiles(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Jokers
              </label>
              <input
                type="number"
                className="w-full p-3 rounded-lg bg-neutral-800 text-white border-2 border-transparent focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
                value={jokers}
                onChange={e => setJokers(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Peças por Jogador
              </label>
              <input
                type="number"
                className="w-full p-3 rounded-lg bg-neutral-800 text-white border-2 border-transparent focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
                value={tilesPerPlayer}
                onChange={e => setTilesPerPlayer(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-600/50 hover:scale-[1.02] cursor-pointer"
          onClick={handleCreate}
        >
          <Play size={20} />
          Criar Jogo
        </button>
      </div>
    </div>
  )
}