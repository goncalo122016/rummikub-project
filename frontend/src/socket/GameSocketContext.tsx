import { createContext, useContext } from "react"

export const GameSocketContext = createContext<{
  send: (type: string, data?: any) => void
  ready: boolean
}>({
  send: () => {},
  ready: false,
})

export function useGameSocketContext() {
  const ctx = useContext(GameSocketContext)
  if (!ctx) throw new Error("useGameSocketContext outside provider")
  return ctx
}
