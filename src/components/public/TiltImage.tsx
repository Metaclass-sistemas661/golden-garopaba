'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Image from 'next/image'

interface TiltImageProps {
  src: string
  alt: string
}

export default function TiltImage({ src, alt }: TiltImageProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Suavização do movimento
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 })

  // Converte a posição do mouse em ângulos de rotação (máximo 15 graus)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    // Calcula a posição relativa do mouse no container (de -0.5 a 0.5)
    const mouseX = (e.clientX - rect.left) / width - 0.5
    const mouseY = (e.clientY - rect.top) / height - 0.5
    
    x.set(mouseX)
    y.set(mouseY)
  }

  const handleMouseLeave = () => {
    // Retorna ao centro suavemente
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        perspective: 1000, // Dá a ilusão de profundidade 3D
        cursor: 'grab'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
      >
        <Image 
          src={src} 
          alt={alt} 
          fill 
          style={{ objectFit: 'contain', pointerEvents: 'none' }} 
        />
      </motion.div>
    </motion.div>
  )
}
