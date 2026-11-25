import Link from 'next/link'
import Image from 'next/image'
import styles from './Header.module.css'
import { ChevronDown } from 'lucide-react'
import MobileMenu from './MobileMenu'
import { buildWhatsappUrl } from '@/utils/propertyDisplay'

export default async function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.nav}`}>
        {/* Left: Logo */}
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logo} style={{ display: 'flex', alignItems: 'center' }}>
            <Image src="/logo00.png" alt="Golden Garopaba" className={styles.logoImg} width={240} height={100} priority />
          </Link>
        </div>
        
        {/* Center: Navigation Links */}
        <div className={styles.links}>
          <Link href="/" className={styles.link}>Início</Link>
          
          {/* Dropdown Menu para Imóveis */}
          <div className={styles.dropdownContainer}>
            <Link href="/imoveis" className={styles.link} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Imóveis <ChevronDown size={16} />
            </Link>
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
          <a href={buildWhatsappUrl('Olá, gostaria de falar com um corretor!')} target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
            Fale Conosco
          </a>
        </div>

        {/* Mobile Menu */}
        <MobileMenu />
      </div>
    </header>
  )
}
