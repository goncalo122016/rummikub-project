import { useState, useEffect, useRef } from "react"
import type { Tile } from "../types/Tile"
import TileComponent from "./Tile"
import { ChevronDown, Play, SkipForward, Hourglass, CopyPlus } from "lucide-react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
  name: string | null
  tiles: Tile[]
  onPlay?: (tiles: Tile[]) => void
  onReorder?: (order: string[]) => void
  onGrab?: () => void
  onSkip?: () => void
  isMyTurn: boolean
  canGrab?: boolean
}

export default function Hand({
  name,
  tiles = [],
  onPlay,
  onReorder,  
  onGrab,
  onSkip,
  isMyTurn,
  canGrab,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState(false)

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  const collapsedDuringDrag = useRef(false)

  const tilesContainerRef = useRef<HTMLDivElement>(null)
  const prevTurnRef = useRef(isMyTurn)

  // Toast quando passa a ser a tua vez
  useEffect(() => {
    if (!prevTurnRef.current && isMyTurn) {
      toast.success("Atenção! É a tua vez!", {
        duration: 4000,
      })
    }
    prevTurnRef.current = isMyTurn
  }, [isMyTurn])

  // Listener global para dragend
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      console.log("Global dragend disparado, collapsedDuringDrag:", collapsedDuringDrag.current)
      
      // Se colapsou durante o drag → expande
      if (collapsedDuringDrag.current) {
        console.log("Largou fora do card - expandindo...")
        setCollapsed(false)
        collapsedDuringDrag.current = false
      }
      
      setDragIndex(null)
      setInsertIndex(null)
      window._draggedTileId = null
    }

    document.addEventListener('dragend', handleGlobalDragEnd)
    return () => document.removeEventListener('dragend', handleGlobalDragEnd)
  }, [])

  useEffect(() => {
    setSelected(new Set())
  }, [tiles])

  const toggleSelect = (tileId: string) => {
    if (!isMyTurn) return

    setSelected(prev => {
      const next = new Set(prev)
      next.has(tileId) ? next.delete(tileId) : next.add(tileId)
      return next
    })
  }

  const playSelected = () => {
    if (!isMyTurn || selected.size === 0) return
    const selectedTiles = tiles.filter(t => selected.has(t.id))
    onPlay?.(selectedTiles)
    setSelected(new Set())
  }

  const onDragStart = (tileId: string, index: number) => {
    console.log("Drag started")
    setDragIndex(index)
    collapsedDuringDrag.current = false
    window._draggedTileId = tileId
  }

  const onDragOverTile = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    if (dragIndex === null) return

    const rect = e.currentTarget.getBoundingClientRect()
    const midX = rect.left + rect.width / 2

    setInsertIndex(e.clientX < midX ? index : index + 1)
  }

  const onDragLeaveContainer = (e: React.DragEvent<HTMLDivElement>) => {
    if (!tilesContainerRef.current) return
    
    const rect = tilesContainerRef.current.getBoundingClientRect()
    const isOutside = 
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom

    if (isOutside && dragIndex !== null && !collapsed) {
      console.log("Saiu do container - colapsando e marcando flag")
      // Colapsa E marca que colapsou durante drag
      collapsedDuringDrag.current = true
      setCollapsed(true)
    }
  }

  const onDrop = () => {
    if (dragIndex === null || insertIndex === null) return

    const next = [...tiles]
    const [moved] = next.splice(dragIndex, 1)

    const finalIndex =
      dragIndex < insertIndex ? insertIndex - 1 : insertIndex

    next.splice(finalIndex, 0, moved)

    onReorder?.(next.map(t => t.id))

    setDragIndex(null)
    setInsertIndex(null)
  }

  return (
    <div className="w-full bg-neutral-900 rounded-xl p-3 md:p-4 text-white shadow-xl">
      <div
        className="flex justify-between items-center cursor-pointer select-none"
        onClick={() => setCollapsed(v => !v)}
      >
        <div>
          <h2 className="text-base md:text-lg font-bold">{name}</h2>
          <p className="text-xs md:text-sm text-neutral-400">
            {tiles.length} peças
          </p>
        </div>

        <motion.div 
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {!isMyTurn && (
              <motion.div 
                className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-yellow-500/10 px-3 md:px-4 py-2 text-yellow-400 text-xs md:text-sm border border-yellow-500/20"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Hourglass size={16} className="animate-pulse shrink-0" />
                <span className="text-center">
                  Não é a tua vez, mas podes <strong className="font-semibold">organizar a mão</strong>
                </span>
              </motion.div>
            )}

            <motion.div 
              className="relative mt-4 p-1"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {!isMyTurn && (
                <div className="absolute inset-0 bg-neutral-900/60 rounded-lg z-10 pointer-events-none" />
              )}

              <div 
                ref={tilesContainerRef}
                className="flex gap-1.5 md:gap-2 justify-center flex-wrap"
                onDragLeave={onDragLeaveContainer}
              >
                {tiles.map((tile, index) => (
                  <div
                    key={tile.id}
                    draggable={isMyTurn}
                    onDragStart={() => onDragStart(tile.id, index)}
                    onDragOver={e => {
                      e.preventDefault()
                      onDragOverTile(e, index)
                    }}
                    onDrop={onDrop}
                    className="relative items-center"
                  >
                    {insertIndex === index && (
                      <div className="absolute -left-1 top-0 bottom-0 w-px bg-white rounded-full" />
                    )}

                    <TileComponent
                      tile={tile}
                      selected={selected.has(tile.id)}
                      onSelect={() => toggleSelect(tile.id)}
                    />

                    {insertIndex === index + 1 && (
                      <div className="absolute -right-1 top-0 bottom-0 w-px bg-white rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ACTIONS */}
            <motion.div 
              className="mt-4 md:mt-5 flex flex-wrap justify-center gap-2 md:gap-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={playSelected}
                disabled={!isMyTurn || selected.size === 0}
                className="
                  flex items-center gap-1.5 md:gap-2
                  px-4 md:px-6 py-2 rounded-lg
                  text-sm md:text-base font-medium
                  bg-blue-600 hover:bg-blue-700
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-200
                  shadow-lg hover:shadow-blue-600/50
                  cursor-pointer
                "
              >
                <Play size={16} />
                <span>Jogar</span>
              </button>

              <button
                onClick={onSkip}
                disabled={!isMyTurn}
                className="
                  flex items-center gap-1.5 md:gap-2
                  px-3 md:px-4 py-2 rounded-lg
                  text-sm md:text-base font-medium
                  bg-neutral-700 hover:bg-neutral-600
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-200
                  cursor-pointer
                "
              >
                <SkipForward size={16} />
                <span>Passar</span>
              </button>

              {onGrab && (
                <button
                  onClick={onGrab}
                  disabled={!isMyTurn || !canGrab}
                  className="
                    md:hidden
                    flex items-center gap-1.5
                    px-3 py-2 rounded-lg
                    text-sm font-medium
                    bg-green-600 hover:bg-green-700
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-200
                    shadow-lg hover:shadow-green-600/50
                    cursor-pointer
                  "
                >
                  <CopyPlus size={16} />
                  <span>Apanhar</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}