import { useState } from "react"
import { CopyPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
  isMyTurn: boolean
  onGrab: () => void
  canGrab?: boolean
}

export default function Pile({ isMyTurn, onGrab, canGrab }: Props) {
  const [animating, setAnimating] = useState(false)

  function handleGrab() {
    if (!isMyTurn || !canGrab || animating) return
    setAnimating(true)
    onGrab()

    setTimeout(() => {
      setAnimating(false)
    }, 600)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <AnimatePresence>
        {animating && (
          <motion.div
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{ x: 40, opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute"
          >
            <div className="w-18 h-24 bg-white rounded border-2 border-gray-300 shadow-md" />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onClick={handleGrab}
        className={`
          w-18 h-24 rounded-lg
          bg-gray-100 border-2 border-gray-400
          shadow-lg
          flex items-center justify-center
          transition ml-2
          ${isMyTurn && canGrab ? "hover:scale-105 cursor-pointer" : "opacity-50 cursor-not-allowed"}
        `}
      >
        <CopyPlus size={24} />
      </div>
    </div>
  )
}
