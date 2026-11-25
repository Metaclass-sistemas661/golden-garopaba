'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from '@studio-freight/lenis'

const DISABLED_PREFIXES = ['/painel', '/login', '/esqueceu-senha', '/redefinir-senha']

export default function SmoothScrolling({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Não aplica smooth scroll artificial no painel administrativo, auth ou se usuário prefere movimento reduzido
    if (DISABLED_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      lerp: 0.16, // Responsivo e fluido, sem sensação de atraso/arrasto
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    })

    let rafId = 0
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [pathname])

  return <>{children}</>
}
