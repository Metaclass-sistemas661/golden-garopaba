'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

interface TiltImageProps {
  src: string
  alt: string
}

const MAX_TILT_DEG = 15
const EASING = 0.12

/**
 * Efeito de inclinação 3D leve, sem dependências (substitui framer-motion na landing).
 * - Só ativa em dispositivos com mouse (pointer: fine) e sem prefers-reduced-motion.
 * - Atualiza apenas `transform` (camada de composição) via requestAnimationFrame,
 *   e para o loop assim que o movimento assenta — zero custo quando ocioso.
 */
export default function TiltImage({ src, alt }: TiltImageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const inner = innerRef.current
    if (!wrapper || !inner) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let rafId = 0

    const tick = () => {
      currentX += (targetX - currentX) * EASING
      currentY += (targetY - currentY) * EASING
      inner.style.transform = `rotateX(${currentY.toFixed(2)}deg) rotateY(${currentX.toFixed(2)}deg)`

      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        rafId = requestAnimationFrame(tick)
      } else {
        rafId = 0
      }
    }

    const schedule = () => {
      if (!rafId) rafId = requestAnimationFrame(tick)
    }

    const handleMove = (e: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect()
      const relX = (e.clientX - rect.left) / rect.width - 0.5
      const relY = (e.clientY - rect.top) / rect.height - 0.5
      targetX = relX * 2 * MAX_TILT_DEG
      targetY = -relY * 2 * MAX_TILT_DEG
      schedule()
    }

    const handleLeave = () => {
      targetX = 0
      targetY = 0
      schedule()
    }

    wrapper.addEventListener('pointermove', handleMove, { passive: true })
    wrapper.addEventListener('pointerleave', handleLeave, { passive: true })

    return () => {
      wrapper.removeEventListener('pointermove', handleMove)
      wrapper.removeEventListener('pointerleave', handleLeave)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', position: 'relative', perspective: 1000, cursor: 'grab' }}
    >
      <div
        ref={innerRef}
        style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          quality={80}
          sizes="(max-width: 1024px) 100vw, 50vw"
          style={{ objectFit: 'contain', pointerEvents: 'none' }}
        />
      </div>
    </div>
  )
}
