"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
            <Image src="/logo1.png" alt="Golden Garopaba" className={styles.menuLogo} width={150} height={50} />
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

          <div className={styles.mobileActions}>
            <a href="https://wa.me/5548999999999?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20um%20corretor!" target="_blank" rel="noopener noreferrer" className={styles.ctaBtn} onClick={closeMenu}>
              Fale Conosco
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
