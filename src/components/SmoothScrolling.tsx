'use client'

import { ReactNode, useEffect } from 'react'
import Lenis from '@studio-freight/lenis'

export default function SmoothScrolling({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.05, // Muito menor o lerp, mais arrastado e "manteiga" fica o scroll
      smoothWheel: true,
      wheelMultiplier: 1.2, // Um pouco mais rápido pra compensar o lerp pesado
      touchMultiplier: 2,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
