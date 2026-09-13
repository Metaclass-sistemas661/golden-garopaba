import Link from 'next/link'
import Image from 'next/image'
import styles from './Header.module.css'
import { ChevronDown } from 'lucide-react'
import MobileMenu from './MobileMenu'

export default async function Header() {
  // Settings podem ser buscadas se necessário

  return (
    <header className={styles.header}>
      <div className={`container ${styles.nav}`}>
        {/* Left: Logo */}
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logo} style={{ display: 'flex', alignItems: 'center' }}>
            <Image src="/logo1.png" alt="Golden Garopaba" className={styles.logoImg} width={150} height={50} />
          </Link>
        </div>
        
        {/* Center: Navigation Links */}
        <div className={styles.links}>
          <Link href="/" className={styles.link}>Início</Link>
          
          {/* Dropdown Menu para Imóveis */}
          <div className={styles.dropdownContainer}>
            <span className={styles.link} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Imóveis <ChevronDown size={16} />
            </span>
            <div className={styles.dropdownMenu}>
              <Link href="/imoveis/comprar" className={styles.dropdownItem}>Comprar</Link>
              <Link href="/imoveis/alugar" className={styles.dropdownItem}>Alugar</Link>
            </div>
          </div>
          
          <Link href="/lancamentos" className={styles.link}>Lançamentos</Link>
          <Link href="/sobre" className={styles.link}>Sobre Nós</Link>
        </div>

        {/* Right: CTA Button */}
        <div className={styles.ctaContainer}>
          <Link href="/contato" className={styles.ctaBtn}>
            Fale Conosco
          </Link>
        </div>

        {/* Mobile Menu */}
        <MobileMenu />
      </div>
    </header>
  )
}
