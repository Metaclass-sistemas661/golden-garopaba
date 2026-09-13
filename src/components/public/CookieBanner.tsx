"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'
import styles from './CookieBanner.module.css'

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Verifica se já aceitou os cookies
    const hasAccepted = localStorage.getItem('cookiesAccepted')
    if (!hasAccepted) {
      // Delay pequeno para não assustar o usuário assim que abre a página
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookiesAccepted', 'true')
    setIsVisible(false)
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.bannerContent}>
        <div className={styles.textSection}>
          <div className={styles.iconWrapper}>
            <Cookie size={24} />
          </div>
          <div>
            <h3>Nós valorizamos sua privacidade</h3>
            <p>
              Utilizamos cookies para aprimorar sua experiência de navegação, analisar nosso tráfego e oferecer conteúdos personalizados. Ao continuar no site, você concorda com o nosso <Link href="/cookies">Uso de Cookies</Link> e <Link href="/privacidade">Política de Privacidade</Link>.
            </p>
          </div>
        </div>
        
        <div className={styles.actionSection}>
          <button className={styles.acceptBtn} onClick={handleAccept}>
            Aceitar Todos
          </button>
          <button className={styles.closeBtn} onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
