"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Building, Users, Settings, LogOut, PanelLeftClose, PanelLeftOpen, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const menuItems = [
    { label: 'Dashboard', icon: Home, href: '/painel' },
    { label: 'Imóveis', icon: Building, href: '/painel/imoveis' },
    { label: 'Corretores', icon: Users, href: '/painel/corretores' },
    { label: 'Geocoding', icon: Globe, href: '/painel/geocoding' },
    { label: 'Configurações', icon: Settings, href: '/painel/configuracoes' },
  ]

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.logoSection}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>G</span>
          {!isCollapsed && <span className={styles.logoText}>Garopaba</span>}
        </div>
        <button 
          className={styles.collapseBtn} 
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon size={20} className={styles.navIcon} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <button 
          onClick={handleLogout} 
          className={styles.navLink} 
          title={isCollapsed ? 'Sair' : ''}
          style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        >
          <LogOut size={20} className={styles.navIcon} />
          {!isCollapsed && <span>Sair / Voltar</span>}
        </button>
      </div>
    </aside>
  )
}
