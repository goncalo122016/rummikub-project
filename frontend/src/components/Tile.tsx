import type { Tile } from "../types/Tile"
import clsx from "clsx"
import { Check } from "lucide-react"

interface Props {
  tile: Tile
  selected?: boolean
  onSelect?: (tile: Tile) => void
}

const COLORS = {
  red: "#C0392B",
  blue: "#1E6FD9",
  black: "#2C2C2C",
  yellow: "#F1C40F",
  joker: "#6C3483",
}

const TILE_BG = "#F6F1E7"
const TILE_BORDER = "#D4CFC4"

export default function TileComponent({
  tile,
  selected = false,
  onSelect,
}: Props) {
  const color = COLORS[tile.joker ? "joker" : tile.color]

  return (
    <div
      draggable
      onDragStart={() => {
        window._draggedTileId = tile.id
      }}
      onClick={() => onSelect?.(tile)}
      className={clsx(
        "relative w-16 h-20 rounded-xl",
        "flex flex-col items-center justify-between",
        "cursor-pointer select-none",
        "transition-all duration-150",
        "shadow-sm hover:shadow-md hover:-translate-y-0.5",
        selected && "ring-2 ring-emerald-500 ring-offset-2"
      )}
      style={{
        background: `linear-gradient(to bottom, ${TILE_BG}, #EFE8DC)`,
        border: `2px solid ${color || TILE_BORDER}`,
      }}
    >
      {selected && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow">
          <Check size={14} strokeWidth={3} />
        </div>
      )}

      <div className="flex-1 flex text-3xl font-extrabold items-center justify-center">
        {tile.joker ? (
          <span style={{ color: COLORS.joker }} className="tracking-wide">
            J
          </span>
        ) : (
          <span style={{ color }}>{tile.number}</span>
        )}
      </div>

      <div className="w-full flex flex-col items-center mb-3">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}
