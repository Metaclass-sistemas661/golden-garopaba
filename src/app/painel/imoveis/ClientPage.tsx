"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Filter, Handshake } from 'lucide-react'
import styles from './page.module.css'
import { deleteProperty } from '@/app/actions/properties'
import TransactionModal from '@/components/admin/TransactionModal'
import { PropertyDTO, BrokerDTO } from '@/types/dto'

import Image from 'next/image'

export default function AdminPropertiesListClient({ initialProperties, brokers }: { initialProperties: PropertyDTO[], brokers: BrokerDTO[] }) {
  const [properties, setProperties] = useState<PropertyDTO[]>(initialProperties)
  const [isPending, setIsPending] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Estado do Modal de Transação
  const [modalData, setModalData] = useState<{ id: string, title: string, type: 'SALE'|'RENT' } | null>(null)

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  // Handlers Reais com Server Actions
  const handleDelete = async (id: string) => {
    if(confirm('Tem certeza que deseja excluir este imóvel definitivamente?')) {
      setIsPending(id)
      const res = await deleteProperty(id)
      if (res.success) {
        setProperties(properties.filter(p => p.id !== id))
      }
      setIsPending(null)
    }
  }

  const handleTransactionSuccess = () => {
    setModalData(null)
    // Para simplificar, recarregamos a página para atualizar o status do servidor
    window.location.reload()
  }

  // Derived state (Filters & Pagination)
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.location || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter ? p.status === statusFilter : true
      const matchesType = typeFilter ? p.transactionType === typeFilter : true

      return matchesSearch && matchesStatus && matchesType
    })
  }, [properties, searchQuery, statusFilter, typeFilter])

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage)
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Meus Imóveis</h1>
          <p className={styles.subtitle}>Gerencie o portfólio completo da imobiliária.</p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.filtersSection}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Buscar por código, título ou localização..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          <div className={styles.filterDropdowns}>
            <div className={styles.filterIconWrapper}>
              <Filter size={18} />
            </div>
            <select 
              className={styles.select} 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Status (Todos)</option>
              <option value="AVAILABLE">Disponível</option>
              <option value="SOLD">Vendido</option>
              <option value="RENTED">Alugado</option>
            </select>
            <select 
              className={styles.select}
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Categoria (Todas)</option>
              <option value="SALE">Venda</option>
              <option value="RENT">Aluguel</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Código</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Status</th>
                <th className={styles.actionsColumn}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProperties.length > 0 ? (
                paginatedProperties.map(property => (
                  <tr key={property.id}>
                    <td>
                      <div className={styles.propertyInfo}>
                        <Image src={property.photos[0] || '/placeholder.png'} alt={property.title} className={styles.thumb} width={64} height={64} unoptimized style={{objectFit: 'cover'}} />
                        <div>
                          <span className={styles.propertyTitle}>{property.title}</span>
                          <span className={styles.propertyLoc}>{property.location}</span>
                        </div>
                      </div>
                    </td>
                    <td><strong>{property.code}</strong></td>
                    <td><span className={styles.typeBadge}>{property.transactionType === 'SALE' ? 'Venda' : property.transactionType === 'RENT' ? 'Aluguel' : 'Lançamento'}</span></td>
                    <td className={styles.priceColumn}>
                      {property.transactionType === 'RENT' 
                        ? (property.rentPrice ? `${formatPrice(property.rentPrice)}/mês` : 'Sob Consulta')
                        : (property.price > 0 
                            ? formatPrice(property.price) 
                            : ((property.rentPrice ?? 0) > 0 ? `${formatPrice(property.rentPrice ?? 0)}/mês` : 'Sob Consulta'))}
                    </td>
                    <td>
                      <span className={
                        (property.status === 'SOLD' || property.status === 'RENTED') ? styles.statusSold : styles.statusActive
                      }>
                        {property.status === 'SOLD' ? 'Vendido' : property.status === 'RENTED' ? 'Alugado' : 'Disponível'}
                      </span>
                    </td>
                    <td className={styles.actionsColumn}>
                      <div className={styles.actions}>
                        {property.status !== 'SOLD' && property.status !== 'RENTED' && (
                          <button 
                            className={`${styles.actionBtn} ${styles.btnSuccess}`} 
                            title="Registrar Fechamento"
                            onClick={() => setModalData({ id: property.id, title: property.title, type: property.transactionType === 'LANCAMENTO' ? 'SALE' : property.transactionType as 'SALE' | 'RENT' })}
                          >
                            <Handshake size={18} />
                          </button>
                        )}
                        <Link href={`/painel/imoveis/${property.id}/editar`} className={styles.actionBtn} title="Editar Imóvel">
                          <Edit size={18} />
                        </Link>
                        <button 
                          className={`${styles.actionBtn} ${styles.danger}`} 
                          title="Excluir" 
                          onClick={() => handleDelete(property.id)}
                          disabled={isPending === property.id}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    Nenhum imóvel encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Mostrando {filteredProperties.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredProperties.length)} de {filteredProperties.length} imóveis
          </span>
          <div className={styles.pageButtons}>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <TransactionModal 
        isOpen={!!modalData} 
        onClose={() => setModalData(null)}
        propertyId={modalData?.id || ''}
        propertyTitle={modalData?.title || ''}
        transactionType={modalData?.type || 'SALE'}
        brokers={brokers}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  )
}
