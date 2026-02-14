import { useState, useEffect } from "react"
import { useGameSocketContext } from "../socket/GameSocketContext"
import type { Tile } from "../types/Tile"
import type { Combination } from "../types/Combination"
import Hand from "../components/Hand"
import Board from "../components/Board"
import JoinPage from "./JoinPage"
import WaitingPage from "./WaitingPage"
import LoadingPage from "./LoadingPage"
import CreateGamePage from "./CreateGamePage"
import StarfieldBackground from "../components/StarfieldBackground"
import Pile from "../components/Pile"
import PlayersBar from "../components/PlayersBar"
import { useSplitDraft } from "../hooks/useSplitDraft"
import logo from "../assets/rummi-logo.png"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import { colorFromName } from "../utils/playerColor"
import { LogOut, RefreshCw } from "lucide-react"

export default function Game() {
  type GameStatus = "loading" | "join" | "create" | "waiting" | "playing"

  const [status, setStatus] = useState<GameStatus>("loading")
  const [playerName, setPlayerName] = useState<string|null>(localStorage.getItem("playerName"))
  const [players, setPlayers] = useState<any[]>([])
  const [maxPlayers, setMaxPlayers] = useState<number>(0)
  const [hand, setHand] = useState<Tile[]>([])
  const [handOrder, setHandOrder] = useState<string[]>([])
  const [board, setBoard] = useState<Combination[]>([])
  const [myTurn, setMyTurn] = useState<boolean>(false)
  const [currentTurn, setCurrentTurn] = useState<string>("")
  const [canGrab, setCanGrab] = useState<boolean>(true)

  const { send, ready } = useGameSocketContext()
  const split = useSplitDraft()

  useEffect(() => {
    if (!split.canConfirm) return
  
    const payload = split.buildPayload()
    if (!payload) return
  
    send("split", payload)
    split.cancelSplit()
  }, [split.canConfirm])

  useEffect(() => {
    if (handOrder.length > 0) {
      localStorage.setItem("handOrder", JSON.stringify(handOrder))
    }
  }, [handOrder])

  useEffect(() => {
    if (!ready) return

    if (!playerName) {
      setStatus("join")
      return
    }

    send("sync", { name: playerName })
    setStatus("loading")
  }, [ready])

  useEffect(() => {
    const handler = (e: any) => {
      const msg = e.detail
      switch (msg.type) {
        case "waiting":
          if (!msg.data?.players) return

          setPlayers(msg.data.players)
          setMaxPlayers(msg.data.max_players)
          setStatus("waiting")
          break
        case "joined":
          setHand(msg.data.me.tiles)
          setStatus("waiting")
          break

        case "tile_grabbed":
          setHand(prev => {
            const updated = [...prev, msg.data]
            setHandOrder(order => [...order, msg.data.id])
            return updated
          })
          break

        case "sync_state":
          setHand(msg.data.me.tiles)
          setBoard(msg.data.table)
          setCurrentTurn(msg.data.current_turn)
          setMyTurn(msg.data.current_turn === msg.data.me.name)
          setPlayers(msg.data.players.map((p: any) => p.name))
          setMaxPlayers(msg.data.max_players)
          setCanGrab(!msg.data.me.played_this_turn)

          const serverTiles: Tile[] = msg.data.me.tiles
          const serverIds = serverTiles.map(t => t.id)

          const saved = localStorage.getItem("handOrder")
          let finalOrder: string[] = []

          if (saved) {
            const parsed: string[] = JSON.parse(saved)

            // mantém só ids que ainda existem
            const validSaved = parsed.filter(id => serverIds.includes(id))

            // adiciona novos ids que não estavam guardados
            const missing = serverIds.filter(id => !validSaved.includes(id))

            finalOrder = [...validSaved, ...missing]
          } else {
            finalOrder = serverIds
          }

          setHandOrder(finalOrder)

          if (msg.data.game_finished) {
            toast.success(`Game over! Player ${msg.data.winner} has won the game!`)
            cleanupAndLeave()
          } else if (msg.data.game_started === false) {
            setStatus("waiting")
          }
          else {
            setStatus("playing")
          }
          break

        case "reset":
          toast.success(msg.data)
          cleanupAndLeave()
          break

        case "sync_error":
          toast.error(msg.data || "Falha ao sincronizar com o servidor")
          setStatus("join")
          break

        case "error":
          toast.error(msg.data || "Ocorreu um erro")
          setStatus("playing")
          break
      }
    }

    window.addEventListener("ws-message", handler)
    return () => window.removeEventListener("ws-message", handler)
  }, [])

  const handleGrab = () => {
    send("grab")
  }

  const handleReorder = (newOrder: string[]) => {
    setHandOrder(newOrder)
  }

  function cleanupAndLeave() {
    setPlayerName("")
    setMaxPlayers(0)
    setPlayers([])
    setHand([])
    setHandOrder([])
    setBoard([])
    setMyTurn(false)
    setStatus("join")
  }

  if (status === "loading") {
    return <LoadingPage />
  }

  if (status === "join") {
    return (
      <JoinPage
        onJoin={(name) => {
          localStorage.setItem("playerName", name)
          setPlayerName(name)
          send("join", { name })
          setStatus("waiting")
        }}
        onCreateRequest={(name) => {
          localStorage.setItem("playerName", name)
          setPlayerName(name)
          setStatus("create")
        }}
      />
    )
  }

  if (status === "create") {
    return (
      <CreateGamePage
        name={playerName}
        onBack={() => setStatus("join")}
        onCreate={(data) => {
          const { name, numPlayers, rules } = data

          const payload: any = {
            name,
            numPlayers
          }
        
          // só envia args extra se forem custom rules
          if (rules.mode === "custom") {
            payload.totalTiles = rules.totalTiles
            payload.jokers = rules.jokers
            payload.tilesPerPlayer = rules.tilesPerPlayer
          }
          
          send("create", payload)
          setStatus("waiting")
        }}
      />
    )
  }

  if (status === "waiting") {
    return <WaitingPage players={players} maxPlayers={maxPlayers} onLeave={() => {
      send("leave")
      cleanupAndLeave()
    }} />
  }

  const displayBoard: Combination[] = (() => {
    const draft = split.draft
    if (!draft) return board

    return board.flatMap((comb) => {
      if (comb.id !== draft.combinationId) {
        return comb
      }

      const leftTiles = [
        ...comb.tiles.filter(t => draft.leftBase.includes(t.id)),
        ...hand.filter(t => draft.addedLeft.includes(t.id)),
      ]

      const rightTiles = [
        ...comb.tiles.filter(t => draft.rightBase.includes(t.id)),
        ...hand.filter(t => draft.addedRight.includes(t.id)),
      ]

      return [
        {
          ...comb,
          id: `${comb.id}-left`,
          tiles: leftTiles,
        },
        {
          ...comb,
          id: `${comb.id}-right`,
          tiles: rightTiles,
        },
      ]
    })
  })()

  const orderedHand: Tile[] =
    handOrder.length === 0
      ? hand
      : handOrder
          .map(id => hand.find(t => t.id === id))
          .filter((t): t is Tile => t !== undefined)

  return (
    <div className="h-screen bg-linear-to-br from-green-900 via-green-800 to-green-900 flex flex-col relative overflow-hidden">
      <StarfieldBackground />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-green-800/95 backdrop-blur-sm shadow-lg border-b border-green-700/30">
        <div className="p-3 md:p-4 flex flex-row justify-between items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <img 
              src={logo} 
              alt="Rummikub" 
              className="h-8 w-8 md:h-12 md:w-12" 
            />
            <h1 className="text-xl md:text-3xl font-bold text-white">
              Rummikub
            </h1>
          </div>

          {/* PlayersBar - integrada no header em desktop apenas */}
          <div className="hidden md:block flex-1 max-w-2xl">
            <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
              {players.map(player => {
                const isTurn = player === currentTurn
                const isMe = player === playerName
                const baseColor = colorFromName(player)

                return (
                  <motion.div
                    key={player}
                    animate={isTurn ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: isTurn ? Infinity : 0, duration: 1.5, ease: "easeInOut" }}
                    className={`
                      relative
                      px-3 md:px-4 py-1.5 md:py-2 
                      rounded-full 
                      text-xs md:text-sm font-semibold text-white
                      ${baseColor}
                      ring-2 md:ring-4 ring-offset-1 md:ring-offset-2 ring-offset-green-800
                      ${isTurn ? "ring-yellow-400/80 shadow-lg shadow-yellow-400/20" : "ring-transparent shadow-md"}
                      ${isMe ? "border-2 border-white/90" : ""}
                      transition-all duration-200
                    `}
                  >
                    <span className="relative z-10">
                      {player}
                      {isMe && <span className="ml-1 text-[10px] md:text-xs opacity-90">(tu)</span>}
                    </span>
                    
                    {isTurn && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-yellow-400/20"
                        animate={{ opacity: [0, 0.4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              className="bg-white hover:bg-red-50 text-red-600 p-2 md:py-2 md:px-4 rounded flex items-center gap-2 transition-colors cursor-pointer"
              onClick={() => {
                send("leave")
                cleanupAndLeave()
              }}
              title="Sair do Jogo"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline text-sm font-medium">Sair do Jogo</span>
            </button>

            <button
              className="bg-red-600 hover:bg-red-700 text-white p-2 md:py-2 md:px-4 rounded flex items-center gap-2 transition-colors cursor-pointer"
              onClick={() => {
                send("reset")
                cleanupAndLeave()
              }}
              title="Novo Jogo"
            >
              <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline text-sm font-medium">Novo Jogo</span>
            </button>
          </div>
        </div>
      </div>

      {/* PlayersBar - MOBILE apenas (depois do header) */}
      <div className="md:hidden relative z-10">
        <PlayersBar
          players={players}
          currentTurn={currentTurn}
          me={playerName}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 relative z-10">
        <Board
          combinations={displayBoard}
          onDropTile={(tileId, targetTiles, side) => {
            if (split.draft) {
              if (!side) return
              split.addTiles(side, [tileId])
              return
            }
            
            send("play", {
              tiles: [tileId],
              table_comb: targetTiles,
            })
          }}
          onSplitCombination={(combId, index, left, right) => {
            split.startSplit(combId, index, left, right)
          }}
        />
      </div>

      <div className="sticky bottom-0 z-20 p-4">
        <div className="flex items-center gap-6">
          
          <div className="hidden md:flex">
            <Pile
                isMyTurn={myTurn}
                onGrab={handleGrab}
                canGrab={canGrab}
            />
          </div>
      
          <Hand
            tiles={orderedHand}
            name={playerName}
            onPlay={(tiles) => {
              send("play", { tiles: tiles.map(t => t.id) })
            }}
            onReorder={handleReorder}
            onSkip={() => send("skip")}
            onGrab={handleGrab}
            isMyTurn={myTurn}
            canGrab={canGrab}
          />
        </div>
      </div>
    </div>
  )
}