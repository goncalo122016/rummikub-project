export type TileColor =
  | "red"
  | "blue"
  | "black"
  | "yellow"
  | "joker"

export interface Tile {
  id: string
  number: number | null
  color: TileColor
  joker: boolean
}
