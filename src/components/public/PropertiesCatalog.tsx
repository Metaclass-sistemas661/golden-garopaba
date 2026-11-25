"use client"

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import styles from './PropertiesCatalog.module.css'
import { MapPin, Bed, Bath, Maximize, Ruler, Car, BadgeCheck, ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown, Map } from 'lucide-react'
import FilterModal, { FilterState } from './FilterModal'
import { PropertyDTO } from '@/types/dto'
import PropertiesMapView from '@/components/maps/PropertiesMapView'
import SmartImage from '@/components/common/SmartImage'
import {
  formatPropertyPriceLabel,
  getEffectivePropertyPrice,
  getTransactionTagLabel,
  normalizeSearchText,
} from '@/utils/propertyDisplay'

interface PropertiesCatalogProps {
  mode: 'SALE' | 'RENT' | 'LANCAMENTO' | 'ALL'
  initialProperties: PropertyDTO[]
}

function buildInitialFilters(mode: PropertiesCatalogProps['mode']): FilterState {
  return {
    transactionType: mode === 'SALE' ? 'Comprar' : mode === 'RENT' ? 'Alugar' : mode === 'LANCAMENTO' ? 'Lancamentos' : 'Todos',
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
}

export default function PropertiesCatalog({ mode, initialProperties }: PropertiesCatalogProps) {
  const searchParams = useSearchParams()
  const initialFilters = useMemo(() => buildInitialFilters(mode), [mode])

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'recent'>('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const sortRef = useRef<HTMLDivElement>(null)

  const locParam = searchParams.get('loc') || ''
  const typeParam = searchParams.get('type') || ''
  const priceParam = searchParams.get('price') || ''

  // Sincroniza filtros com query params da busca rápida
  useEffect(() => {
    if (!locParam && !typeParam && !priceParam) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters((prev) => {
      const next = { ...prev }
      if (locParam) next.searchTerm = locParam
      if (typeParam) next.propertyTypes = [typeParam]
      if (priceParam) {
        if (priceParam === '0-500k') { next.minPrice = 0; next.maxPrice = 500000 }
        else if (priceParam === '0-1m') { next.minPrice = 0; next.maxPrice = 1000000 }
        else if (priceParam === '0-2m') { next.minPrice = 0; next.maxPrice = 2000000 }
        else if (priceParam === '0-5') { next.minPrice = 0; next.maxPrice = 5000000 }
        else if (priceParam === '5-10') { next.minPrice = 5000000; next.maxPrice = 10000000 }
        else if (priceParam === '10-20') { next.minPrice = 10000000; next.maxPrice = 20000000 }
        else if (priceParam === '20+') { next.minPrice = 20000000; next.maxPrice = 20000000 }
      }
      return next
    })
    setCurrentPage(1)
  }, [locParam, typeParam, priceParam])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePageChange = (page: number | ((prev: number) => number)) => {
    const newPage = typeof page === 'function' ? page(currentPage) : page
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredProperties = useMemo(() => {
    let result = [...initialProperties]

    if (filters.transactionType === 'Comprar') {
      result = result.filter(p => p.transactionType === 'SALE')
    } else if (filters.transactionType === 'Alugar') {
      result = result.filter(p => p.transactionType === 'RENT')
    } else if (filters.transactionType === 'Lancamentos') {
      result = result.filter(p => p.transactionType === 'LANCAMENTO')
    }

    if (filters.searchTerm) {
      const normalizedTerm = normalizeSearchText(filters.searchTerm)
      result = result.filter((p) => {
        const haystack = normalizeSearchText(
          `${p.title} ${p.location || ''} ${p.neighborhood || ''} ${p.city || ''} ${p.code}`
        )
        return haystack.includes(normalizedTerm)
      })
    }

    if (filters.propertyCode) {
      const code = normalizeSearchText(filters.propertyCode)
      result = result.filter(p => normalizeSearchText(p.code).includes(code))
    }

    if (filters.category) {
      const categoryMap: Record<string, string> = {
        'Residencial': 'RESIDENTIAL',
        'Comercial': 'COMMERCIAL',
        'Rural': 'RURAL'
      }
      const dbCategory = categoryMap[filters.category] || filters.category
      result = result.filter(p => p.category === dbCategory)
    }

    // Usa preço efetivo (lida corretamente com imóveis de Aluguel que usam rentPrice)
    if (filters.minPrice > 0) {
      result = result.filter(p => getEffectivePropertyPrice(p) >= filters.minPrice)
    }
    if (filters.maxPrice < 20000000) {
      result = result.filter(p => getEffectivePropertyPrice(p) <= filters.maxPrice)
    }

    const minAreaNum = filters.minArea ? parseInt(filters.minArea.replace(/\D/g, ''), 10) : NaN
    const maxAreaNum = filters.maxArea ? parseInt(filters.maxArea.replace(/\D/g, ''), 10) : NaN
    if (Number.isFinite(minAreaNum)) result = result.filter(p => Number(p.areaTotal || 0) >= minAreaNum)
    if (Number.isFinite(maxAreaNum)) result = result.filter(p => Number(p.areaTotal || 0) <= maxAreaNum)

    if (filters.bedrooms) result = result.filter(p => (p.bedrooms || 0) >= filters.bedrooms!)
    if (filters.bathrooms) result = result.filter(p => (p.bathrooms || 0) >= filters.bathrooms!)
    if (filters.suites) result = result.filter(p => (p.suites || 0) >= filters.suites!)
    if (filters.parking) result = result.filter(p => (p.parkingSpaces || 0) >= filters.parking!)

    if (filters.propertyTypes.length > 0) {
      result = result.filter(p => filters.propertyTypes.includes(p.propertyType))
    }

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

    if (sortBy === 'price_asc') {
      result.sort((a, b) => getEffectivePropertyPrice(a) - getEffectivePropertyPrice(b))
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => getEffectivePropertyPrice(b) - getEffectivePropertyPrice(a))
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  }, [filters, sortBy, initialProperties])

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage) || 1
  const safePage = Math.min(currentPage, totalPages)
  const paginatedProperties = filteredProperties.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  )

  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'transactionType') return false
    if (key === 'category') return false
    if (key === 'minPrice' && val === 0) return false
    if (key === 'maxPrice' && val === 20000000) return false
    if (Array.isArray(val)) return val.length > 0
    if (val === null || val === '') return false
    return true
  }).length

  const headerTitle =
    filters.transactionType === 'Comprar'
      ? 'Imóveis para Compra'
      : filters.transactionType === 'Alugar'
        ? 'Imóveis para Locação'
        : filters.transactionType === 'Lancamentos'
          ? 'Lançamentos'
          : 'Todos os Imóveis'

  return (
    <div className={styles.catalogWrapper}>

      {/* Header do Catálogo */}
      <div className={styles.catalogHeader}>
        <h1>{headerTitle}</h1>
        <p>Curadoria exclusiva das propriedades mais extraordinárias.</p>
      </div>

      <div className={styles.catalogLayout}>
        <main className={styles.mainContent}>

          {/* Topbar: Resultados, Botão de Filtro e Ordenação */}
          <div className={styles.topbar}>

            <div className={styles.resultsCountRow}>
              <span className={styles.resultsCount}>
                {filteredProperties.length} {filteredProperties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
              </span>
            </div>

            <div className={styles.controlsRow}>
              <button
                type="button"
                className={styles.openFilterBtn}
                onClick={() => setIsFilterModalOpen(true)}
              >
                <SlidersHorizontal size={18} />
                Filtros
                {activeFiltersCount > 0 && <span className={styles.filterBadge}>{activeFiltersCount}</span>}
              </button>

              <button
                type="button"
                className={styles.openMapBtn}
                onClick={() => setIsMapOpen(true)}
              >
                <Map size={18} />
                Ver no Mapa
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
                        onClick={() => { setSortBy('recent'); setCurrentPage(1); setIsSortOpen(false); }}
                      >
                        Mais Recentes
                      </div>
                      <div
                        className={styles.sortOption}
                        onClick={() => { setSortBy('price_desc'); setCurrentPage(1); setIsSortOpen(false); }}
                      >
                        Maior Preço
                      </div>
                      <div
                        className={styles.sortOption}
                        onClick={() => { setSortBy('price_asc'); setCurrentPage(1); setIsSortOpen(false); }}
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
              {paginatedProperties.map((property, index) => (
                <Link href={`/imoveis/${property.id}`} key={property.id} className={styles.propertyCard}>
                  <div className={styles.cardImageWrapper}>
                    <SmartImage
                      src={property.photos && property.photos.length > 0 ? property.photos[0] : '/placeholder.svg'}
                      alt={property.title}
                      className={styles.cardImage}
                      fill
                      priority={index < 4}
                      quality={75}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className={styles.cardTag}>{getTransactionTagLabel(property.transactionType)}</div>
                    {property.status !== 'AVAILABLE' && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                        {property.status === 'SOLD' ? 'Vendido' : 'Alugado'}
                      </div>
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                      <h3>{property.title}</h3>
                      {property.financeable && (
                        <div className={styles.financeableBadge} title="Imóvel Financiável">
                          <BadgeCheck size={20} />
                        </div>
                      )}
                    </div>
                    <div className={styles.cardCode}>
                      Cód. {property.code}
                    </div>
                    <div className={styles.cardLocation}>
                      <MapPin size={16} />
                      <span>{property.location}</span>
                    </div>
                    <div className={styles.cardFeatures}>
                      {(property.bedrooms || 0) > 0 && (
                        <div className={styles.featureItem} title="Quartos">
                          <Bed size={16} />
                          <span>{property.bedrooms}</span>
                        </div>
                      )}
                      {(property.bathrooms || 0) > 0 && (
                        <div className={styles.featureItem} title="Banheiros">
                          <Bath size={16} />
                          <span>{property.bathrooms}</span>
                        </div>
                      )}
                      {(property.parkingSpaces || 0) > 0 && (
                        <div className={styles.featureItem} title="Vagas de Garagem">
                          <Car size={16} />
                          <span>{property.parkingSpaces}</span>
                        </div>
                      )}
                      {Number(property.areaTotal || 0) > 0 && (
                        <div className={styles.featureItem} title="Área Total">
                          <Maximize size={16} />
                          <span>{Number(property.areaTotal)}m²</span>
                        </div>
                      )}
                      {Number(property.areaUseful || 0) > 0 && (
                        <div className={styles.featureItem} title="Área Útil">
                          <Ruler size={16} />
                          <span>{Number(property.areaUseful)}m²</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.cardPrice}>
                      {formatPropertyPriceLabel(property)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>Nenhuma propriedade encontrada com os filtros selecionados.</p>
              <button type="button" className={styles.clearBtnAlt} onClick={() => { setFilters(initialFilters); setCurrentPage(1); }}>
                Limpar Filtros
              </button>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => handlePageChange(prev => Math.max(prev - 1, 1))}
                disabled={safePage === 1}
                aria-label="Página anterior"
              >
                <ChevronLeft size={20} />
              </button>

              <div className={styles.pageNumbers}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    className={`${styles.pageNumberBtn} ${safePage === i + 1 ? styles.activePage : ''}`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => handlePageChange(prev => Math.min(prev + 1, totalPages))}
                disabled={safePage === totalPages}
                aria-label="Próxima página"
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
          setCurrentPage(1)
        }}
        totalResults={filteredProperties.length}
        mode={mode}
      />

      {/* Modal de Mapa */}
      <PropertiesMapView
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        properties={filteredProperties}
        mode={mode}
      />
    </div>
  )
}
