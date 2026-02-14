import { useState } from "react"

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

  // custom rules
  const [totalTiles, setTotalTiles] = useState(106)
  const [jokers, setJokers] = useState(2)
  const [tilesPerPlayer, setTilesPerPlayer] = useState(14)

  const [error, setError] = useState<string | null>(null)

  function handleCreate() {
    setError(null)

    if (numPlayers < 2 ) {
      setError("Number of players must be at least 2")
      return
    }

    if (rulesMode === "custom") {
      if (tilesPerPlayer < 3) {
        setError("Tiles per player must be at least 3")
        return
      }

      if (jokers < 0) {
        setError("Number of jokers cannot be negative")
        return
      }

      if (totalTiles < numPlayers * tilesPerPlayer) {
        setError("Not enough total tiles for the number of players")
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
    <div className="min-h-screen flex items-center justify-center bg-green-900">
      <div className="bg-neutral-900 p-6 rounded-xl w-80 space-y-4">
        <h1 className="text-xl font-bold text-white text-center">
          Criar Jogo
        </h1>

        <div className="text-sm text-gray-400 text-center">
          Jogador: <span className="text-white">{name}</span>
        </div>

        <p className="text-white">Número de Jogadores:</p>
        <input
          type="number"
          min={2}
          max={4}
          className="w-full p-2 rounded bg-neutral-800 text-white"
          value={numPlayers}
          onChange={e => setNumPlayers(Number(e.target.value))}
        />

        {/* Rules selector */}
        <div className="flex gap-2">
          <button
            className={`w-full py-2 rounded ${
              rulesMode === "classic"
                ? "bg-blue-600 text-white"
                : "bg-neutral-700 text-gray-300"
            }`}
            onClick={() => setRulesMode("classic")}
          >
            Clássico
          </button>

          <button
            className={`w-full py-2 rounded ${
              rulesMode === "custom"
                ? "bg-blue-600 text-white"
                : "bg-neutral-700 text-gray-300"
            }`}
            onClick={() => setRulesMode("custom")}
          >
            Personalizado
          </button>
        </div>

        {/* Custom rules */}
        {rulesMode === "custom" && (
          <div className="space-y-2">
            <p className="text-white">Total de Peças:</p>
            <input
              type="number"
              className="w-full p-2 rounded bg-neutral-800 text-white"
              placeholder="Total de peças"
              value={totalTiles}
              onChange={e => setTotalTiles(Number(e.target.value))}
            />

            <p className="text-white">Jokers:</p>
            <input
              type="number"
              className="w-full p-2 rounded bg-neutral-800 text-white"
              placeholder="Jokers"
              value={jokers}
              onChange={e => setJokers(Number(e.target.value))}
            />

            <p className="text-white">Peças por jogador:</p>
            <input
              type="number"
              className="w-full p-2 rounded bg-neutral-800 text-white"
              placeholder="Peças por jogador"
              value={tilesPerPlayer}
              onChange={e => setTilesPerPlayer(Number(e.target.value))}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
            onClick={onBack}
          >
            Voltar
          </button>

          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            onClick={handleCreate}
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  )
}
