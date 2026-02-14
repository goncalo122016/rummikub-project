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
        mx-1 flex items-center justify-center
        pointer-events-auto
      "
      onClick={onClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => {
        const tileId = window._draggedTileId
        if (!tileId) return

        onDrop?.(tileId)
        window._draggedTileId = null
      }}
      title={`Dividir para o ${side === "left" ? "esquerdo" : "direito"}`}
    >
      <div
        className="
          w-6 h-6
          rounded-full
          bg-green-600
          hover:bg-green-500
          text-white
          flex items-center justify-center
          shadow-md
          transition
          cursor-pointer
        "
      >
        <Scissors size={14} />
      </div>
    </div>
  )
}
