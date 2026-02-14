import { useState } from "react"
import type { Combination } from "../types/Combination"
import TileComponent from "./Tile"
import SplitSlot from "./SplitSlot"

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
      <div className="p-4 mt-3 bg-green-700 rounded-xl text-white italic flex justify-center max-w-md mx-auto">
        Ainda não há combinações no tabuleiro.
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-4 p-4 mt-3 bg-green-700 rounded-xl">
      {combinations.map((comb) => (
        <div
          key={comb.id}
          className="flex items-center p-2 gap-2 border border-green-300 rounded min-w-fit"
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

            return (
              <div
                key={tile.id}
                className={`
                  relative flex items-center
                  transition-[padding] duration-200 ease-out
                  ${isHovered ? "px-4" : "px-0"}
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
                    absolute left-0 -translate-x-1/2
                    transition-all duration-200 ease-out
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
                    absolute right-0 translate-x-1/2
                    transition-all duration-200 ease-out
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