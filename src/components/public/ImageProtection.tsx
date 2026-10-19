"use client"

import { useEffect } from 'react'

/**
 * Camada de dissuasão no site público: bloqueia clique direito, arrastar e
 * "segurar para salvar" (mobile) em imagens. A proteção real é a marca d'água
 * gravada nos pixels no momento do upload — isto apenas dificulta o download casual.
 */
export default function ImageProtection() {
  useEffect(() => {
    const isImage = (t: EventTarget | null) =>
      t instanceof HTMLImageElement || (t instanceof Element && !!t.closest('picture, [data-protect-image]'))

    const block = (e: Event) => { if (isImage(e.target)) e.preventDefault() }

    document.addEventListener('contextmenu', block)
    document.addEventListener('dragstart', block)

    const style = document.createElement('style')
    style.setAttribute('data-image-protection', '')
    style.textContent = `img{-webkit-user-drag:none;user-select:none;-webkit-touch-callout:none;}`
    document.head.appendChild(style)

    return () => {
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('dragstart', block)
      style.remove()
    }
  }, [])

  return null
}
