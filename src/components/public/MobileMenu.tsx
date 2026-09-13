"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react'
import styles from './MobileMenu.module.css'

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isImoveisOpen, setIsImoveisOpen] = useState(false)

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const closeMenu = () => setIsOpen(false)

  return (
    <div className={styles.mobileMenuContainer}>
      <button 
        className={styles.hamburgerBtn} 
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={32} color="var(--color-primary)" />
      </button>

      {isOpen && (
        <div className={styles.overlay}>
          <div className={styles.menuHeader}>
            <img src="/logo1.png" alt="Golden Garopaba" className={styles.menuLogo} />
            <button 
              className={styles.closeBtn} 
              onClick={closeMenu}
              aria-label="Fechar menu"
            >
              <X size={32} color="white" />
            </button>
          </div>

          <nav className={styles.navLinks}>
            <Link href="/" className={styles.link} onClick={closeMenu}>Início</Link>
            
            <div className={styles.dropdownSection}>
              <button 
                className={styles.dropdownBtn} 
                onClick={() => setIsImoveisOpen(!isImoveisOpen)}
              >
                Imóveis {isImoveisOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {isImoveisOpen && (
                <div className={styles.dropdownContent}>
                  <Link href="/imoveis/comprar" className={styles.subLink} onClick={closeMenu}>Comprar</Link>
                  <Link href="/imoveis/alugar" className={styles.subLink} onClick={closeMenu}>Alugar</Link>
                </div>
              )}
            </div>

            <Link href="/lancamentos" className={styles.link} onClick={closeMenu}>Lançamentos</Link>
            <Link href="/sobre" className={styles.link} onClick={closeMenu}>Sobre Nós</Link>
          </nav>

          <div className={styles.menuFooter}>
            <Link href="/contato" className={styles.ctaBtn} onClick={closeMenu}>
              Fale Conosco
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
