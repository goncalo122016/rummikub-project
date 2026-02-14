import { useState } from "react"
import logo from "../assets/rummi-logo.png"
import { UserPlus, Users } from "lucide-react"
import StarfieldBackground from "../components/StarfieldBackground"

interface Props {
  onJoin: (name: string) => void
  onCreateRequest: (name: string) => void
}

export default function JoinPage({ onJoin, onCreateRequest }: Props) {
  const [name, setName] = useState(localStorage.getItem("playerName") || "")
  const [showError, setShowError] = useState(false)

  const hasError = showError && !name

  const handleJoin = () => {
    if (!name.trim()) {
      setShowError(true)
      return
    }
    onJoin(name)
  }

  const handleCreate = () => {
    localStorage.setItem("playerName", name)
    if (!name.trim()) {
      setShowError(true)
      return
    }
    onCreateRequest(name)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-900 via-green-800 to-green-900 relative overflow-hidden p-4">
      <StarfieldBackground />

      <div className="bg-neutral-900/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl w-full max-w-md space-y-6 shadow-2xl border border-white/10 relative z-10">
        <div className="text-center space-y-3">
          <img src={logo} alt="Rummikub Logo" className="w-20 md:w-24 mx-auto drop-shadow-lg" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Rummikub Online
          </h1>
          <p className="text-gray-400 text-sm">
            Junta-te a uma partida ou cria a tua própria sala
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            O teu nome
          </label>
          <input
            className={`
              w-full p-3 rounded-lg bg-neutral-800 text-white
              border-2 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${hasError ? "border-red-500" : "border-transparent"}
            `}
            placeholder="Introduz o teu nome..."
            value={name}
            onChange={e => {
              setName(e.target.value)
              if (showError) setShowError(false)
            }}
            onKeyPress={e => e.key === "Enter" && handleJoin()}
          />

          {hasError && (
            <div className="text-red-400 text-sm flex items-center gap-1">
              <span className="w-1 h-1 bg-red-400 rounded-full" />
              O nome é obrigatório
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-600/50 hover:scale-[1.02] cursor-pointer"
            onClick={handleJoin}
          >
            <UserPlus size={20} />
            Entrar no Jogo
          </button>

          <button
            className="w-full bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
            onClick={handleCreate}
          >
            <Users size={20} />
            Criar Jogo
          </button>
        </div>
      </div>
    </div>
  )
}