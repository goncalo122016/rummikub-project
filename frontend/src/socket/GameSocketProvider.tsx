import { useEffect, useRef, useState } from "react"
import { GameSocketContext } from "./GameSocketContext"

export function GameSocketProvider({
  onMessage,
  children,
}: {
  onMessage: (msg: any) => void
  children: React.ReactNode
}) {
  const socketRef = useRef<WebSocket | null>(null)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_MODE === "production" ? import.meta.env.VITE_WS_URL : `${window.location.protocol === "https:" ? "wss" : "ws"}://localhost:8080/ws`
      
    console.log("Connecting to WebSocket...", wsUrl)
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log("WebSocket connection established!")
      setReady(true);
    }

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      setReady(true);

      onMessage(msg)
    }

    ws.onerror = () => console.error("WebSocket error occurred")

    socketRef.current = ws

    return () => {
      ws.close()
    }
  }, [])

  const send = (type: string, data?: any) => {
    const ws = socketRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(JSON.stringify({ type, data }))
  }

  return (
    <GameSocketContext.Provider value={{ send, ready }}>
      {children}
    </GameSocketContext.Provider>
  )
}
