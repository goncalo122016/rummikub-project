import type { Tile } from "./Tile"

export type CombinationType = "set" | "run"

export interface Combination {
  id: string
  type: CombinationType
  tiles: Tile[]
}