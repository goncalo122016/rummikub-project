import { motion } from "framer-motion"

interface Props {
  density?: number // número de estrelas (default: 200)
  opacity?: number // opacidade base (default: 0.7)
}

export default function StarfieldBackground({ density = 1000, opacity = 0.7 }: Props) {
  // Gera estrelas com posições aleatórias mas animadas suavemente
  const stars = [...Array(density)].map((_, i) => {
    const size = Math.random() * 4 + 0.5
    const initialX = Math.random() * 100
    const initialY = Math.random() * 100
    const starOpacity = Math.random() * opacity + 0.1
    
    return {
      id: i,
      size,
      initialX,
      initialY,
      opacity: starOpacity,
      duration: Math.random() * 3 + 2,
    }
  })

  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          initial={{
            width: star.size + 'px',
            height: star.size + 'px',
            top: star.initialY + '%',
            left: star.initialX + '%',
            opacity: 0
          }}
          animate={{
            opacity: [0, star.opacity, star.opacity, 0],
            scale: [1, 1.2, 1, 0.8, 1]
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            width: star.size + 'px',
            height: star.size + 'px',
          }}
        />
      ))}
    </div>
  )
}