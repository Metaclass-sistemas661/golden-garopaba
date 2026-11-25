"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react'
import styles from './MobileMenu.module.css'
import { buildWhatsappUrl } from '@/utils/propertyDisplay'

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isImoveisOpen, setIsImoveisOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const closeMenu = () => setIsOpen(false)

  return (
    <div className={styles.mobileMenuContainer} ref={menuRef}>
      <button
        type="button"
        className={styles.hamburgerBtn}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={32} color="var(--color-primary)" /> : <Menu size={32} color="var(--color-primary)" />}
      </button>

      {isOpen && (
        <div className={styles.overlay}>
          <div className={styles.menuHeader}>
            <Image src="/logo00.png" alt="Golden Garopaba" className={styles.menuLogo} width={150} height={50} />
            <button
              type="button"
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
                type="button"
                className={styles.dropdownBtn}
                onClick={() => setIsImoveisOpen(!isImoveisOpen)}
              >
                Imóveis {isImoveisOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {isImoveisOpen && (
                <div className={styles.dropdownContent}>
                  <Link href="/imoveis" className={styles.subLink} onClick={closeMenu}>Todos</Link>
                  <Link href="/imoveis/comprar" className={styles.subLink} onClick={closeMenu}>Comprar</Link>
                  <Link href="/imoveis/alugar" className={styles.subLink} onClick={closeMenu}>Alugar</Link>
                </div>
              )}
            </div>

            <Link href="/lancamentos" className={styles.link} onClick={closeMenu}>Lançamentos</Link>
            <Link href="/sobre" className={styles.link} onClick={closeMenu}>Sobre Nós</Link>
          </nav>

          <div className={styles.mobileActions} style={{ marginTop: '1rem' }}>
            <a
              href={buildWhatsappUrl('Olá, gostaria de falar com um corretor!')}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBtn}
              style={{ display: 'block', marginBottom: 0 }}
              onClick={closeMenu}
            >
              Fale Conosco
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
