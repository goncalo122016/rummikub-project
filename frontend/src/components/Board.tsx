import { useState } from "react"
import type { Combination } from "../types/Combination"
import TileComponent from "./Tile"
import SplitSlot from "./SplitSlot"
import { CircleAlert } from "lucide-react"

interface Props {
  combinations: Combination[]
  onDropTile?: (
    tileId: string,
    targetTiles: string[],
    side?: "left" | "right"
  ) => void
  onSplitCombination?: (
    combinationId: string,
    index: number,
    left: string[],
    right: string[]
  ) => void
}

export default function Board({
  combinations,
  onDropTile,
  onSplitCombination,
}: Props) {
  const [hovered, setHovered] = useState<{
    combId: string
    index: number
  } | null>(null)

  if (!combinations || combinations.length === 0) {
    return (
      <div className="p-6 md:p-8 mt-3 bg-green-700/80 backdrop-blur-sm rounded-xl border border-green-600/30 shadow-lg">
        <div className="flex flex-col items-center justify-center gap-3 text-green-200 max-w-md mx-auto">
          <CircleAlert size={48} className="text-green-300 opacity-70" />
          <p className="text-center text-sm md:text-base font-medium">
            Ainda não há combinações no tabuleiro.
          </p>
          <p className="text-center text-xs md:text-sm text-green-300/80">
            Arrasta as peças da tua mão para criar combinações
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3 md:gap-4 p-4 md:p-6 mt-3 bg-green-700/80 backdrop-blur-sm rounded-xl border border-green-600/30 shadow-lg">
      {combinations.map((comb) => (
        <div
          key={comb.id}
          className="flex items-center p-2 md:p-2.5 gap-2 border-2 border-green-500/40 hover:border-green-400/60 bg-green-800/40 rounded-lg transition-all duration-200 min-w-fit shadow-md hover:shadow-lg"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            const tileId = window._draggedTileId
            if (!tileId) return
                    
            let side: "left" | "right" | undefined
                    
            if (comb.id.endsWith("-left")) side = "left"
            if (comb.id.endsWith("-right")) side = "right"

            const targetTiles = comb.tiles.map(t => t.id)
            onDropTile?.(tileId, targetTiles, side)
          
            window._draggedTileId = null
          }}
        >
          {comb.tiles.map((tile, index) => {
            const isHovered =
              hovered?.combId === comb.id &&
              hovered?.index === index
            
            const isFirstTile = index === 0
            const isLastTile = index === comb.tiles.length - 1
            
            // Determina o padding baseado na posição
            let paddingClass = "px-0"
            if (isHovered) {
              if (isFirstTile) {
                paddingClass = "pr-2 pl-0" // Só padding à direita
              } else if (isLastTile) {
                paddingClass = "pl-2 pr-0" // Só padding à esquerda
              } else {
                paddingClass = "px-2" // Padding dos dois lados
              }
            }

            return (
              <div
                key={tile.id}
                className={`
                  relative flex items-center
                  transition-[padding] duration-200 ease-out
                  ${paddingClass}
                `}
                onMouseEnter={() =>
                  setHovered({ combId: comb.id, index })
                }
                onMouseLeave={() => setHovered(null)}
              >

                {/* SPLIT BEFORE */}
                {index > 0 && (
                <div
                  className={`
                    absolute left-0 -translate-x-1/2 top-1/2 -translate-y-1/2
                    transition-all duration-200 ease-out
                    z-20
                    ${isHovered
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-75 pointer-events-none"}
                  `}
                >
                  <SplitSlot
                    side="left"
                    onClick={() => {
                      const left = comb.tiles
                        .slice(0, index)
                        .map(t => t.id)
                      const right = comb.tiles
                        .slice(index)
                        .map(t => t.id)

                      onSplitCombination?.(
                        comb.id,
                        index,
                        left,
                        right
                      )
                    }}
                    onDrop={(tileId) => {
                      onDropTile?.(
                        tileId,
                        comb.tiles.map(t => t.id),
                        "left"
                      )
                    }}
                  />
                </div>
                )}

                <TileComponent tile={tile} />

                {/* SPLIT AFTER */}
                {index < comb.tiles.length - 1 && (
                <div
                  className={`
                    absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2
                    transition-all duration-200 ease-out
                    z-20
                    ${isHovered
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-75 pointer-events-none"}
                  `}
                >
                  <SplitSlot
                    side="right"
                    onClick={() => {
                      const left = comb.tiles
                        .slice(0, index + 1)
                        .map(t => t.id)
                      const right = comb.tiles
                        .slice(index + 1)
                        .map(t => t.id)

                      onSplitCombination?.(
                        comb.id,
                        index + 1,
                        left,
                        right
                      )
                    }}
                    onDrop={(tileId) => {
                      onDropTile?.(
                        tileId,
                        comb.tiles.map(t => t.id),
                        "right"
                      )
                    }}
                  />
                </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}