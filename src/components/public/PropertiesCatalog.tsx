"use client"

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './PropertiesCatalog.module.css'
import { MapPin, Bed, Bath, Square, ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown } from 'lucide-react'
import FilterModal, { FilterState } from './FilterModal'
import { PropertyDTO } from '@/types/dto'

interface PropertiesCatalogProps {
  mode: 'SALE' | 'RENT' | 'LANCAMENTO'
  initialProperties: PropertyDTO[]
}

export default function PropertiesCatalog({ mode, initialProperties }: PropertiesCatalogProps) {
  // Inicializamos o filtro com o mode passado pela página
  const initialFilters: FilterState = {
    transactionType: mode === 'SALE' ? 'Comprar' : mode === 'RENT' ? 'Alugar' : 'Lancamentos',
    searchTerm: '',
    propertyCode: '',
    category: '',
    minPrice: 0,
    maxPrice: 20000000,
    minArea: '',
    maxArea: '',
    bedrooms: null,
    bathrooms: null,
    suites: null,
    parking: null,
    propertyTypes: [],
    amenities: []
  }

  // Modal State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>(initialFilters)

  // Lê os parâmetros da URL (da busca rápida da Home)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loc = params.get('loc');
    const type = params.get('type');
    const price = params.get('price');
    
    if (loc || type || price) {
      setFilters(prev => {
        const newFilters = { ...prev };
        if (loc) newFilters.searchTerm = loc; 
        if (type) newFilters.propertyTypes = [type];
        if (price) {
          if (price === '0-5') { newFilters.maxPrice = 5000000; }
          else if (price === '5-10') { newFilters.minPrice = 5000000; newFilters.maxPrice = 10000000; }
          else if (price === '10-20') { newFilters.minPrice = 10000000; newFilters.maxPrice = 20000000; }
          else if (price === '20+') { newFilters.minPrice = 20000000; }
        }
        return newFilters;
      });
    }
  }, []);
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  // Fecha o dropdown de ordenação se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  
  // Estado para ordenação
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'recent'>('recent')
  
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8 // 4 per row, so 2 rows

  // Lógica de Filtragem
  const filteredProperties = useMemo(() => {
    let result = [...initialProperties]

    // Filtro por tipo de transação (Comprar/Alugar/Lançamentos do Modal)
    if (filters.transactionType === 'Comprar') {
      result = result.filter(p => p.transactionType === 'SALE')
    } else if (filters.transactionType === 'Alugar') {
      result = result.filter(p => p.transactionType === 'RENT')
    } else if (filters.transactionType === 'Lancamentos') {
      result = result.filter(p => p.transactionType === 'LANCAMENTO')
    }

    // Filtro por texto (título ou localização)
    if (filters.searchTerm) {
      const lowerTerm = filters.searchTerm.toLowerCase()
      result = result.filter(p => 
        p.title.toLowerCase().includes(lowerTerm) || 
        (p.location || '').toLowerCase().includes(lowerTerm)
      )
    }

    // Filtro por Código
    if (filters.propertyCode) {
      const code = filters.propertyCode.toLowerCase().trim()
      result = result.filter(p => p.code.toLowerCase().includes(code))
    }

    // Filtro por Categoria (Sempre ativo, default: Residencial)
    if (filters.category) {
      const categoryMap: Record<string, string> = {
        'Residencial': 'RESIDENTIAL',
        'Comercial': 'COMMERCIAL',
        'Rural': 'RURAL'
      }
      const dbCategory = categoryMap[filters.category] || filters.category
      result = result.filter(p => p.category === dbCategory)
    }

    // Filtros de Preço (agora são numéricos diretos)
    if (filters.minPrice > 0) result = result.filter(p => Number(p.price) >= filters.minPrice)
    if (filters.maxPrice < 20000000) result = result.filter(p => Number(p.price) <= filters.maxPrice)

    // Filtros de Área
    if (filters.minArea) result = result.filter(p => Number(p.areaTotal || 0) >= parseInt(filters.minArea.replace(/\D/g, '')))
    if (filters.maxArea) result = result.filter(p => Number(p.areaTotal || 0) <= parseInt(filters.maxArea.replace(/\D/g, '')))

    // Contadores
    if (filters.bedrooms) result = result.filter(p => (p.bedrooms || 0) >= filters.bedrooms!)
    if (filters.bathrooms) result = result.filter(p => (p.bathrooms || 0) >= filters.bathrooms!)
    if (filters.suites) result = result.filter(p => (p.suites || 0) >= filters.suites!)
    if (filters.parking) result = result.filter(p => (p.parkingSpaces || 0) >= filters.parking!)

    // Tipos de Propriedade (OR logic se múltiplo selecionado)
    if (filters.propertyTypes.length > 0) {
      result = result.filter(p => filters.propertyTypes.includes(p.propertyType))
    }

    // Comodidades (AND logic - deve ter todas as selecionadas)
    if (filters.amenities.length > 0) {
      result = result.filter(p => {
        const allAmenities = [
          ...(p.features || []),
          ...(p.leisure || []),
          ...(p.security || []),
          ...(p.furniture || []),
          ...(p.environments || []),
          ...(p.infrastructure || [])
        ]
        return filters.amenities.every(amenity => allAmenities.includes(amenity))
      })
    }

    // Ordenação
    if (sortBy === 'price_asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price))
    } else {
      result.sort((a, b) => (a.id > b.id ? -1 : 1))
    }

    return result
  }, [mode, filters, sortBy, initialProperties])

  // Lógica de Paginação
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage) || 1
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  // Contar quantos filtros estão ativos visualmente (ignora maxPrice=20mi e minPrice=0, e default category)
  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'transactionType') return false; // Transação é o modo base da página
    if (key === 'category') return false; // Categoria sempre tem uma ativa
    if (key === 'minPrice' && val === 0) return false;
    if (key === 'maxPrice' && val === 20000000) return false;
    if (Array.isArray(val)) return val.length > 0;
    if (val === null || val === '') return false;
    return true;
  }).length;

  return (
    <div className={styles.catalogWrapper}>
      
      {/* Header do Catálogo */}
      <div className={styles.catalogHeader}>
        <h1>{filters.transactionType === 'Comprar' ? 'Imóveis para Compra' : filters.transactionType === 'Alugar' ? 'Imóveis para Locação' : 'Lançamentos'}</h1>
        <p>Curadoria exclusiva das propriedades mais extraordinárias.</p>
      </div>

      <div className={styles.catalogLayout}>
        {/* Main Content (Grid Ocupando Toda a Tela) */}
        <main className={styles.mainContent}>
          
          {/* Topbar: Resultados, Botão de Filtro e Ordenação */}
          <div className={styles.topbar}>
            
            <div className={styles.resultsCountRow}>
              <span className={styles.resultsCount}>
                {filteredProperties.length} resultados Imóveis
              </span>
            </div>

            <div className={styles.controlsRow}>
              <button 
                className={styles.openFilterBtn} 
                onClick={() => setIsFilterModalOpen(true)}
              >
                <SlidersHorizontal size={18} />
                Filtros
                {activeFiltersCount > 0 && <span className={styles.filterBadge}>{activeFiltersCount}</span>}
              </button>

              <div className={styles.sortContainer} ref={sortRef}>
                <label className={styles.sortLabel}>Ordenar por:</label>
                <div className={styles.customSort} onClick={() => setIsSortOpen(!isSortOpen)}>
                  <div className={`${styles.sortSelected} ${isSortOpen ? styles.sortActive : ''}`}>
                    {sortBy === 'recent' ? 'Mais Recentes' : sortBy === 'price_desc' ? 'Maior Preço' : 'Menor Preço'}
                    <ChevronDown size={16} />
                  </div>
                  
                  {isSortOpen && (
                    <div className={styles.sortOptions}>
                      <div 
                        className={styles.sortOption} 
                        onClick={() => { setSortBy('recent'); setIsSortOpen(false); }}
                      >
                        Mais Recentes
                      </div>
                      <div 
                        className={styles.sortOption} 
                        onClick={() => { setSortBy('price_desc'); setIsSortOpen(false); }}
                      >
                        Maior Preço
                      </div>
                      <div 
                        className={styles.sortOption} 
                        onClick={() => { setSortBy('price_asc'); setIsSortOpen(false); }}
                      >
                        Menor Preço
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>

          {/* Grid de Propriedades */}
          {paginatedProperties.length > 0 ? (
            <div className={styles.propertyGrid}>
              {paginatedProperties.map(property => (
                <Link href={`/imoveis/${property.id}`} key={property.id} className={styles.propertyCard}>
                  <div className={styles.cardImageWrapper}>
                    <Image 
                      src={property.photos && property.photos.length > 0 ? property.photos[0] : '/placeholder.jpg'} 
                      alt={property.title} 
                      className={styles.cardImage}
                      fill
                      unoptimized
                      style={{ objectFit: 'cover' }}
                    />
                    <div className={styles.cardTag}>{property.transactionType === 'SALE' ? 'Venda' : property.transactionType === 'RENT' ? 'Aluguel' : 'Lançamento'}</div>
                    {property.status !== 'AVAILABLE' && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                        {property.status === 'SOLD' ? 'Vendido' : 'Alugado'}
                      </div>
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <h3>{property.title}</h3>
                    <div className={styles.cardLocation}>
                      <MapPin size={16} />
                      <span>{property.location}</span>
                    </div>
                    <div className={styles.cardFeatures}>
                      <div className={styles.featureItem}>
                        <Bed size={16} />
                        <span>{property.bedrooms || 0}</span>
                      </div>
                      <div className={styles.featureItem}>
                        <Bath size={16} />
                        <span>{property.bathrooms || 0}</span>
                      </div>
                      <div className={styles.featureItem}>
                        <Square size={16} />
                        <span>{Number(property.areaTotal || 0)}m²</span>
                      </div>
                    </div>
                    <div className={styles.cardPrice}>
                      {property.transactionType === 'RENT' 
                        ? (Number(property.rentPrice) > 0 ? `${formatPrice(Number(property.rentPrice))}/mês` : 'Sob Consulta')
                        : (Number(property.price) > 0 
                            ? formatPrice(Number(property.price)) 
                            : (Number(property.rentPrice) > 0 ? `${formatPrice(Number(property.rentPrice))}/mês` : 'Sob Consulta'))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>Nenhuma propriedade encontrada com os filtros selecionados.</p>
              <button className={styles.clearBtnAlt} onClick={() => setFilters(initialFilters)}>
                Limpar Filtros
              </button>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                className={styles.pageBtn} 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className={styles.pageNumbers}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i}
                    className={`${styles.pageNumberBtn} ${currentPage === i + 1 ? styles.activePage : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                className={styles.pageBtn} 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

        </main>
      </div>

      {/* Modal de Filtros Avançados */}
      <FilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentFilters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters)
          setCurrentPage(1) // Volta pra primeira página ao filtrar
        }}
        totalResults={filteredProperties.length}
        mode={mode}
      />
    </div>
  )
}
