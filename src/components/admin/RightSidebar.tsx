"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { PlusCircle, Bell, Settings, UserPlus, DollarSign, Key, User } from 'lucide-react'
import styles from './RightSidebar.module.css'
import { getRecentNotifications, NotificationItem } from '@/app/actions/notifications'

export default function RightSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await getRecentNotifications()
        setNotifications(data)
        setUnreadCount(data.filter(n => n.isNew).length)
      } catch (error) {
        console.error("Erro ao buscar notificações", error)
      }
    }
    loadNotifications()
    
    // Configurar polling a cada 60s
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      // Ao abrir, zera o contador visual
      setUnreadCount(0)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'SALE': return <DollarSign size={16} color="#10b981" />
      case 'RENT': return <Key size={16} color="#3b82f6" />
      case 'LEAD': return <User size={16} color="#f59e0b" />
      default: return <Bell size={16} />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m atrás`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h atrás`
    return `${Math.floor(hours / 24)}d atrás`
  }

  return (
    <aside className={styles.rightSidebar}>
      <div className={styles.topSection}>
        <div className={styles.userIconWrapper} title="Perfil do Usuário">
          <img 
            src="https://ui-avatars.com/api/?name=Admin&background=d4af37&color=fff" 
            alt="User Avatar" 
            className={styles.avatar}
          />
        </div>

        <Link href="/painel/imoveis/novo" className={styles.iconBtn} data-tooltip="Cadastrar Imóvel">
          <PlusCircle size={22} />
        </Link>
        <Link href="/painel/corretores/novo" className={styles.iconBtn} data-tooltip="Cadastrar Corretor">
          <UserPlus size={22} />
        </Link>

        <div className={styles.notificationWrapper} ref={dropdownRef}>
          <button 
            className={`${styles.iconBtn} ${isOpen ? styles.activeBtn : ''}`} 
            onClick={toggleDropdown}
            data-tooltip={isOpen ? undefined : "Notificações"}
          >
            <Bell size={22} />
            {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
          </button>

          {isOpen && (
            <div className={styles.notificationDropdown}>
              <div className={styles.dropdownHeader}>
                <h4>Notificações Recentes</h4>
                <span>Últimos 7 dias</span>
              </div>
              
              <div className={styles.dropdownContent}>
                {notifications.length === 0 ? (
                  <div className={styles.emptyState}>Nenhum evento recente.</div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className={`${styles.notifItem} ${notif.isNew ? styles.newItem : ''}`}>
                      <div className={styles.notifIconWrapper}>
                        {getIcon(notif.type)}
                      </div>
                      <div className={styles.notifText}>
                        <h5>{notif.title}</h5>
                        <p>{notif.description}</p>
                        <span className={styles.notifTime}>{formatTime(notif.timestamp)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

    </aside>
  )
}
