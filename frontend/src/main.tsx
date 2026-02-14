import React from "react"
import ReactDOM from "react-dom/client"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import App from "./App"
import "./index.css"
import { GameSocketProvider } from "./socket/GameSocketProvider"
import { Toaster } from "react-hot-toast"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Toaster position="top-right" />
    <GameSocketProvider
      onMessage={(msg) => window.dispatchEvent(
        new CustomEvent("ws-message", { detail: msg })
      )}
    >
      <DndProvider backend={HTML5Backend}>
        <App />
      </DndProvider>
    </GameSocketProvider>
  </React.StrictMode>
)
