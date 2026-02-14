import { Scissors } from "lucide-react"

type SplitSide = "left" | "right"

interface Props {
  side: SplitSide
  onClick: () => void
  onDrop?: (tileId: string) => void
}

export default function SplitSlot({ side, onClick, onDrop }: Props) {
  return (
    <div
      className="
        flex items-center justify-center
        pointer-events-auto
        z-10
      "
      onClick={onClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => {
        const tileId = window._draggedTileId
        if (!tileId) return

        onDrop?.(tileId)
        window._draggedTileId = null
      }}
      title={`Dividir para ${side === "left" ? "a esquerda" : "a direita"}`}
    >
      <div
        className="
          w-6 h-6
          rounded-full
          bg-green-600/90
          hover:bg-green-500
          hover:scale-110
          text-white
          flex items-center justify-center
          shadow-lg
          border-2 border-white/30
          transition-all duration-200
          cursor-pointer
        "
      >
        <Scissors size={14} className="rotate-90" />
      </div>
    </div>
  )
}