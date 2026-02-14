import { motion } from "framer-motion"
import { colorFromName } from "../utils/playerColor"

interface Props {
  players: string[]
  currentTurn: string
  me: string | null
}

export default function PlayersBar({ players, currentTurn, me }: Props) {
  return (
    <div className="py-3 px-4">
      <div className="flex justify-center gap-2 md:gap-3 flex-wrap max-w-4xl mx-auto">
        {players.map(player => {
          const isTurn = player === currentTurn
          const isMe = player === me
          const baseColor = colorFromName(player)

          return (
            <motion.div
              key={player}
              animate={isTurn ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: isTurn ? Infinity : 0, duration: 1.5, ease: "easeInOut" }}
              className={`
                relative
                px-3 md:px-4 py-1.5 md:py-2 
                rounded-full 
                text-xs md:text-sm font-semibold text-white
                ${baseColor}
                ring-2 md:ring-4 ring-offset-1 md:ring-offset-2 ring-offset-green-900
                ${isTurn ? "ring-yellow-400/80 shadow-lg shadow-yellow-400/20" : "ring-transparent shadow-md"}
                ${isMe ? "border-2 border-white/90" : ""}
                transition-all duration-200
              `}
            >
              <span className="relative z-10">
                {player}
                {isMe && <span className="ml-1 text-[10px] md:text-xs opacity-90">(tu)</span>}
              </span>
              
              {isTurn && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-yellow-400/20"
                  animate={{ opacity: [0, 0.4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}