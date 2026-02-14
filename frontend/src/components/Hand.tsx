import { useState, useEffect } from "react"
import type { Tile } from "../types/Tile"
import TileComponent from "./Tile"
import { ChevronUp, ChevronDown, Play, SkipForward, Hourglass, CopyPlus } from "lucide-react"

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
    setDragIndex(index)
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
    <div className="w-full bg-neutral-900 rounded-xl p-4 text-white shadow-xl">
      {/* HEADER */}
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setCollapsed(v => !v)}
      >
        <div>
          <h2 className="text-lg font-bold">{name}</h2>
          <p className="text-sm text-neutral-400">
            {tiles.length} peças
          </p>
        </div>

        {collapsed ? <ChevronUp /> : <ChevronDown />}
      </div>

      {/* TURN INFO */}
      {!isMyTurn && !collapsed && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-2 text-yellow-400 text-sm border border-yellow-500/20">
          <Hourglass size={20} className="animate-pulse" />
          <span>
            Não é a tua vez, mas podes <strong>organizar a mão</strong>
          </span>
        </div>
      )}

      {!collapsed && (
        <>
          <div className="mt-4 flex gap-2 justify-center flex-wrap">
            {tiles.map((tile, index) => (
              <div
                key={tile.id}
                draggable
                onDragStart={() => onDragStart(tile.id, index)}
                onDragOver={e => {
                  e.preventDefault()
                  onDragOverTile(e, index)
                }}
                onDrop={onDrop}
                className="relative"
              >
                {insertIndex === index && (
                  <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-white" />
                )}

                <TileComponent
                  tile={tile}
                  selected={selected.has(tile.id)}
                  onSelect={() => toggleSelect(tile.id)}
                />

                {insertIndex === index + 1 && (
                  <div className="absolute -right-1 top-0 bottom-0 w-0.5 bg-white" />
                )}
              </div>
            ))}
          </div>
          </>
          )}

          {/* ACTIONS */}
          <div className="mt-5 flex justify-center gap-4">
            <button
              onClick={playSelected}
              disabled={!isMyTurn || selected.size === 0}
              className="
                flex items-center gap-2
                px-6 py-2 rounded-lg
                bg-blue-600 hover:bg-blue-700
                disabled:opacity-40
                transition
              "
            >
              <Play size={16} />
              Jogar
            </button>

            <button
              onClick={onSkip}
              disabled={!isMyTurn}
              className="
                flex items-center gap-2
                px-4 py-2 rounded-lg
                bg-neutral-700 hover:bg-neutral-600
                disabled:opacity-40
                transition
              "
            >
              <SkipForward size={16} />
              Passar
            </button>

            {/* MOBILE GRAB */}
            {onGrab && (
              <button
                onClick={onGrab}
                disabled={!isMyTurn || !canGrab}
                className="
                  md:hidden
                  flex items-center gap-2
                  px-4 py-2 rounded-lg
                  bg-neutral-700 hover:bg-neutral-600
                  disabled:opacity-40
                  transition
                "
              >
                <CopyPlus size={16} />
                Apanhar
              </button>
            )}
            </div>
    </div>
  )
}
