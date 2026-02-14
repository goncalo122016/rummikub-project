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
import Pile from "../components/Pile"
import PlayersBar from "../components/PlayersBar"
import { useSplitDraft } from "../hooks/useSplitDraft"
import logo from "../assets/rummi-logo.png"
import toast from "react-hot-toast"

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

  const InGame = players.some((p : any) => p.name === playerName)

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
    if (!InGame) {
      setStatus("join")
      return
    }

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

        case "sync":
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
    <div className="h-screen bg-green-800 flex flex-col">

      <div className="sticky top-0 z-20 bg-green-800 p-4 flex justify-between items-center">
        <div className="flex items-center">
          <img src={logo} alt="Rummikub Logo" className="h-12 w-12 mx-2" />
          <h1 className="text-3xl font-bold text-white ml-3">Rummikub</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="bg-white hover:bg-red-100 text-red-600  py-2 px-4 rounded"
            onClick={() => {
              send("leave")
              cleanupAndLeave()
            }}
          >
            Sair do Jogo
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            onClick={() => {
              send("reset")
              cleanupAndLeave()
            }}
          >
            Novo Jogo
          </button>
        </div>
      </div>

      <PlayersBar
        players={players}
        currentTurn={currentTurn}
        me={playerName}
      />

      <div className="flex-1 overflow-y-auto px-6">
        <Board
          combinations={displayBoard}
          onDropTile={(tileId, targetTiles, side) => {
            if (split.draft) {
              if (!side) return // ignora drops fora do split
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

      <div className="sticky bottom-0 z-20 bg-green-800 p-4">
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
