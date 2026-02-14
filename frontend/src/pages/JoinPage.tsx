import { useState } from "react"
import logo from "../assets/rummi-logo.png"

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
    <div className="min-h-screen flex items-center justify-center bg-green-900">
      <div className="bg-neutral-900 p-6 rounded-xl w-80 space-y-4">
        <img src={logo} alt="Rummikub Logo" className="w-20 mx-auto" />
        <h1 className="text-xl font-bold text-white text-center">
          Rummikub Online
        </h1>

        <input
          className={`
            w-full p-2 rounded bg-neutral-800 text-white
            border-2
            ${hasError ? "border-red-500" : "border-transparent"}
          `}
          placeholder="O seu nome"
          value={name}
          onChange={e => {
            setName(e.target.value)
            if (showError) setShowError(false)
          }}
        />

        {hasError && (
          <div className="text-red-500 text-sm">
            O nome é obrigatório
          </div>
        )}

        <div className="flex gap-2">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            onClick={handleJoin}
          >
            Entrar no Jogo
          </button>

          <button
            className="w-full bg-white hover:bg-blue-100 text-blue-600 border-2 border-blue-600 py-2 rounded"
            onClick={handleCreate}
          >
            Criar Jogo
          </button>
        </div>
      </div>
    </div>
  )
}
