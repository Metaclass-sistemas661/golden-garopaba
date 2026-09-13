"use client"

import { Search } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import styles from '@/app/painel/corretores/page.module.css'

export default function BrokerSearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (query) {
        params.set('q', query)
      } else {
        params.delete('q')
      }
      router.push(`${pathname}?${params.toString()}`)
    }, 400) // Debounce de 400ms

    return () => clearTimeout(timer)
  }, [query, pathname, router, searchParams])

  return (
    <div className={styles.searchBox}>
      <Search size={18} className={styles.searchIcon} color="#94a3b8" />
      <input 
        type="text" 
        placeholder="Buscar corretor por nome ou CRECI..." 
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
    </div>
  )
}
