import { motion } from "framer-motion"
import { colorFromName } from "../utils/playerColor"

interface Props {
  players: string[]
  currentTurn: string
  me: string | null
}

export default function PlayersBar({ players, currentTurn, me }: Props) {
  return (
    <div className="flex justify-center gap-3 py-2 flex-wrap">
      {players.map(player => {
        const isTurn = player === currentTurn
        const isMe = player === me
        const baseColor = colorFromName(player)

        return (
          <motion.div
            key={player}
            animate={isTurn ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: isTurn ? Infinity : 0, duration: 1.2 }}
            className={`
              px-4 py-2 rounded-full text-sm font-semibold text-white
              ${baseColor}
              ${isTurn ? "ring-4 ring-yellow-300 ring-offset-2 ring-offset-green-800" : ""}
              ${isMe ? "border-2 border-white" : ""}
            `}
          >
            {player}
            {isMe && " (you)"}
          </motion.div>
        )
      })}
    </div>
  )
}
