"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { MapPin, Bed, Bath, Maximize, Ruler, Car, Check, Share2, Heart, MessageCircle, Home, X, ChevronLeft, ChevronRight, BadgeCheck, Loader2 } from 'lucide-react'
import styles from './PropertyDetails.module.css'
import { PropertyDTO } from '@/types/dto'
import PropertyMapModal from '@/components/maps/PropertyMapModal'
import SmartImage from '@/components/common/SmartImage'
import {
  buildWhatsappUrl,
  formatBRL,
  formatPropertyPriceLabel,
  getTransactionActionLabel,
  getTransactionTagLabel,
  sanitizeRichHtml,
} from '@/utils/propertyDisplay'

interface PropertyDetailsProps {
  property: PropertyDTO
  similarProperties: PropertyDTO[]
  whatsappNumber?: string | null
}

const FAVORITES_STORAGE_KEY = 'golden-garopaba:favorites'

export default function PropertyDetails({ property, similarProperties, whatsappNumber }: PropertyDetailsProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [shareFeedback, setShareFeedback] = useState(false)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [loadedPhotos, setLoadedPhotos] = useState<Set<string>>(() => new Set())

  const touchStartXRef = useRef<number | null>(null)
  const thumbsContainerRef = useRef<HTMLDivElement>(null)

  const photos = property.photos || []
  const hasPhotos = photos.length > 0
  const safeIndex = hasPhotos ? Math.min(Math.max(activePhotoIndex, 0), photos.length - 1) : 0
  const currentPhoto = hasPhotos ? photos[safeIndex] : '/placeholder.svg'
  const isCurrentPhotoLoaded = loadedPhotos.has(currentPhoto)

  const markPhotoLoaded = useCallback((url: string) => {
    setLoadedPhotos((prev) => {
      if (prev.has(url)) return prev
      const next = new Set(prev)
      next.add(url)
      return next
    })
  }, [])

  // Carrega estado de favorito persistido localmente
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.includes(property.id)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsFavorite(true)
      }
    } catch {
      // ignora erro de localStorage privado
    }
  }, [property.id])

  const toggleFavorite = () => {
    setIsFavorite((prev) => {
      const next = !prev
      try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
        const list: string[] = raw ? JSON.parse(raw) : []
        const filtered = Array.isArray(list) ? list.filter((id) => id !== property.id) : []
        if (next) filtered.push(property.id)
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(filtered))
      } catch {
        // ignora
      }
      return next
    })
  }

  const openGallery = (index: number) => {
    if (!hasPhotos) return
    setActivePhotoIndex(Math.min(Math.max(index, 0), photos.length - 1))
    setIsGalleryOpen(true)
  }

  const closeGallery = useCallback(() => setIsGalleryOpen(false), [])

  const nextPhoto = useCallback(() => {
    if (photos.length <= 1) return
    setActivePhotoIndex((prev) => (prev >= photos.length - 1 ? 0 : prev + 1))
  }, [photos.length])

  const prevPhoto = useCallback(() => {
    if (photos.length <= 1) return
    setActivePhotoIndex((prev) => (prev <= 0 ? photos.length - 1 : prev - 1))
  }, [photos.length])

  // Bloqueia scroll e habilita atalhos de teclado (Esc, Setas) quando o modal está aberto
  useEffect(() => {
    if (!isGalleryOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.classList.add('lenis-stopped')

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeGallery()
      else if (e.key === 'ArrowRight') nextPhoto()
      else if (e.key === 'ArrowLeft') prevPhoto()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.documentElement.classList.remove('lenis-stopped')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isGalleryOpen, closeGallery, nextPhoto, prevPhoto])

  // Mantém a miniatura ativa visível na barra inferior do lightbox
  useEffect(() => {
    if (!isGalleryOpen || !thumbsContainerRef.current) return
    const activeThumb = thumbsContainerRef.current.children[safeIndex] as HTMLElement | undefined
    activeThumb?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [isGalleryOpen, safeIndex])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareFeedback(true)
      setTimeout(() => setShareFeedback(false), 2500)
    } catch {
      alert('Copie o link na barra de endereço do navegador.')
    }
  }

  const handleOpenMap = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMapOpen(true)
  }

  const handleWhatsappClick = () => {
    const url = buildWhatsappUrl(
      `Olá, vi o imóvel código ${property.code} (${property.title}) no site e gostaria de mais informações.`,
      whatsappNumber
    )
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Deduplica comodidades (ex: 'Elevador' existe em Características e Infraestrutura)
  const allAmenities = Array.from(
    new Set([
      ...(property.features || []),
      ...(property.leisure || []),
      ...(property.security || []),
      ...(property.furniture || []),
      ...(property.environments || []),
      ...(property.infrastructure || []),
    ])
  )

  const sanitizedDescription = sanitizeRichHtml(property.description)

  // Índices adjacentes para pré-carregamento instantâneo no lightbox
  const adjacentUrls = isGalleryOpen && photos.length > 1
    ? Array.from(
        new Set([
          photos[(safeIndex + 1) % photos.length],
          photos[(safeIndex - 1 + photos.length) % photos.length],
          ...(photos.length > 2 ? [photos[(safeIndex + 2) % photos.length]] : []),
        ])
      ).filter((u) => u && u !== currentPhoto)
    : []

  return (
    <div className={styles.container}>

      {/* 1. Galeria de Imagens (Grid Assimétrico) */}
      <section className={styles.gallerySection}>
        <div className={styles.galleryGrid} style={{ gridTemplateColumns: photos.length <= 1 ? '1fr' : undefined }}>
          {/* Foto Principal Esquerda */}
          <div className={styles.mainPhotoWrapper} onClick={() => openGallery(0)} style={{ cursor: hasPhotos ? 'pointer' : 'default', position: 'relative' }}>
            <SmartImage
              src={photos[0] || '/placeholder.svg'}
              alt={property.title}
              className={styles.mainPhoto}
              fill
              priority
              quality={80}
              sizes="(max-width: 768px) 100vw, 66vw"
              style={{ objectFit: 'cover' }}
            />
            {property.status !== 'AVAILABLE' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '3rem', letterSpacing: '4px', textTransform: 'uppercase', zIndex: 10 }}>
                {property.status === 'SOLD' ? 'Vendido' : 'Alugado'}
              </div>
            )}
            <div className={styles.photoOverlayTags}>
              {hasPhotos && (
                <button type="button" className={styles.overlayBtn} onClick={(e) => { e.stopPropagation(); openGallery(0); }}>
                  <Home size={16} /> Fotos ({photos.length})
                </button>
              )}
              <button type="button" className={styles.overlayBtn} onClick={handleOpenMap}>
                <MapPin size={16} /> Mapa
              </button>
            </div>
          </div>

          {/* Fotos Menores Direita */}
          {photos.length > 1 && (
            <div className={styles.sidePhotos}>
              <div className={styles.sidePhotoWrapper} onClick={() => openGallery(1)} style={{ cursor: 'pointer', position: 'relative' }}>
                <SmartImage
                  src={photos[1]}
                  alt={`${property.title} - Foto 2`}
                  className={styles.sidePhoto}
                  fill
                  priority
                  quality={75}
                  sizes="(max-width: 768px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>

              {photos.length > 2 && (
                <div className={styles.sidePhotoWrapper} onClick={() => openGallery(2)} style={{ cursor: 'pointer', position: 'relative' }}>
                  <SmartImage
                    src={photos[2]}
                    alt={`${property.title} - Foto 3`}
                    className={styles.sidePhoto}
                    fill
                    quality={75}
                    sizes="(max-width: 768px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                  {photos.length > 3 && (
                    <div className={styles.viewMoreOverlay}>
                      <span>+ {photos.length - 3} fotos</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2. Conteúdo Principal */}
      <div className={styles.contentLayout}>

        {/* Lado Esquerdo: Detalhes */}
        <div className={styles.leftColumn}>

          <div className={styles.header}>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>{property.title}</h1>
              <p className={styles.location}>
                {property.location}
              </p>
            </div>

            <div className={styles.headerActions}>
              <span className={styles.codeTag}>Cód. {property.code}</span>
              <button
                type="button"
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                className={`${styles.iconBtn} ${isFavorite ? styles.favoriteActive : ''}`}
                onClick={toggleFavorite}
              >
                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                aria-label="Copiar link do imóvel"
                className={styles.iconBtn}
                onClick={handleShare}
                title={shareFeedback ? 'Link copiado!' : 'Compartilhar link'}
              >
                {shareFeedback ? <Check size={20} color="#10b981" /> : <Share2 size={20} />}
              </button>
            </div>
          </div>

          {property.status === 'AVAILABLE' && (
            <div className={styles.priceSection}>
              <span className={styles.transactionType}>
                {getTransactionActionLabel(property.transactionType)}
              </span>
              <h2 className={styles.price}>
                {formatPropertyPriceLabel(property)}
              </h2>

              {(Number(property.condoPrice || 0) > 0 || Number(property.iptuPrice || 0) > 0) && (
                <div className={styles.additionalCosts}>
                  {Number(property.condoPrice || 0) > 0 ? <span>Condomínio: <strong>{formatBRL(Number(property.condoPrice))}</strong></span> : null}
                  {Number(property.condoPrice || 0) > 0 && Number(property.iptuPrice || 0) > 0 ? <span className={styles.costSeparator}>•</span> : null}
                  {Number(property.iptuPrice || 0) > 0 ? <span>IPTU: <strong>{formatBRL(Number(property.iptuPrice))}</strong></span> : null}
                </div>
              )}
            </div>
          )}

          {/* Grid de Especificações */}
          <div className={styles.specsGrid}>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Área total</span>
              <span className={styles.specValue}><Maximize size={18} /> {Number(property.areaTotal || 0)} m²</span>
            </div>
            {Number(property.areaUseful || 0) > 0 && (
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Área útil</span>
                <span className={styles.specValue}><Ruler size={18} /> {Number(property.areaUseful)} m²</span>
              </div>
            )}
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Quartos</span>
              <span className={styles.specValue}><Bed size={18} /> {property.bedrooms || 0}</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Suítes</span>
              <span className={styles.specValue}><Bed size={18} /> {property.suites}</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Banheiros</span>
              <span className={styles.specValue}><Bath size={18} /> {property.bathrooms}</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Vagas</span>
              <span className={styles.specValue}><Car size={18} /> {property.parkingSpaces || 0}</span>
            </div>
          </div>

          {/* Descrição */}
          <div className={styles.descriptionSection}>
            <h3>Descrição</h3>
            <div
              className={styles.descriptionText}
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          </div>

          {/* Comodidades */}
          {allAmenities.length > 0 && (
            <div className={styles.amenitiesSection}>
              <h3>Comodidades do imóvel</h3>
              <div className={styles.amenitiesGrid}>
                {allAmenities.map((amenity) => (
                  <div key={amenity} className={styles.amenityItem}>
                    <Check size={18} className={styles.checkIcon} />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Sticky Sidebar (Contato) */}
        <div className={styles.rightColumn}>
          <div className={styles.stickySidebar}>

            {/* Tag Financiável (Dinâmico do banco de dados) */}
            {property.financeable && (
              <div className={styles.financableCard}>
                <div className={styles.financableIcon}>
                  <BadgeCheck size={28} strokeWidth={2.5} />
                </div>
                <div className={styles.financableText}>
                  <span className={styles.financableTitle}>Imóvel Financiável</span>
                  <span className={styles.financableSubtitle}>Aceita financiamento bancário</span>
                </div>
              </div>
            )}

            {property.status === 'AVAILABLE' ? (
              <div className={styles.contactCard}>
                <h3>Fale com um corretor</h3>
                <p>Tem dúvidas sobre o imóvel <strong>{property.code}</strong>? Entre em contato agora mesmo via WhatsApp para um atendimento rápido.</p>

                <button type="button" className={styles.whatsappBtn} onClick={handleWhatsappClick}>
                  <MessageCircle size={20} />
                  Chamar no WhatsApp
                </button>
              </div>
            ) : (
              <div className={styles.contactCard} style={{ textAlign: 'center', padding: '2rem' }}>
                <BadgeCheck size={48} strokeWidth={1.5} color="#d4af37" style={{ marginBottom: '1rem' }} />
                <h3>Imóvel Negociado</h3>
                <p>Este imóvel já foi <strong>{property.status === 'SOLD' ? 'vendido' : 'alugado'}</strong> e não está mais disponível para novas negociações.</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Imóveis Similares */}
      {similarProperties && similarProperties.length > 0 && (
        <section className={styles.similarSection}>
          <h3>Imóveis similares</h3>
          <div className={styles.similarGrid}>
            {similarProperties.map((sim) => (
              <Link href={`/imoveis/${sim.id}`} key={sim.id} className={styles.propertyCard}>
                <div className={styles.cardImageWrapper} style={{ position: 'relative' }}>
                  <SmartImage
                    src={sim.photos && sim.photos.length > 0 ? sim.photos[0] : '/placeholder.svg'}
                    alt={sim.title}
                    fill
                    quality={75}
                    sizes="(max-width: 768px) 100vw, 360px"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className={styles.cardTag}>{getTransactionTagLabel(sim.transactionType)}</div>
                </div>
                <div className={styles.cardContent}>
                  <h4>{sim.title}</h4>
                  <p className={styles.cardLoc}>{sim.location}</p>
                  <div className={styles.cardFeatures}>
                    <span>{Number(sim.areaTotal || 0)}m²</span>
                    <span>{sim.bedrooms || 0} quartos</span>
                    <span>{sim.bathrooms || 0} banheiros</span>
                    <span>{sim.parkingSpaces || 0} vagas</span>
                  </div>
                  <div className={styles.cardPrice}>
                    {getTransactionActionLabel(sim.transactionType)}
                    <strong>{formatPropertyPriceLabel(sim)}</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Galeria FullScreen (Modal) */}
      {isGalleryOpen && hasPhotos && (
        <div
          className={styles.galleryModal}
          role="dialog"
          aria-modal="true"
          aria-label="Galeria de fotos do imóvel"
          data-lenis-prevent="true"
        >
          <div className={styles.modalOverlay} onClick={closeGallery} />

          {/* Barra Superior: Contador + Fechar */}
          <div className={styles.modalTopBar}>
            <div className={styles.photoCounter}>
              {safeIndex + 1} / {photos.length}
            </div>
            <button type="button" className={styles.closeBtn} onClick={closeGallery} aria-label="Fechar galeria">
              <X size={28} />
            </button>
          </div>

          {/* Palco Principal com Swipe + Setas + Loading State */}
          <div
            className={styles.modalContent}
            onTouchStart={(e) => { touchStartXRef.current = e.changedTouches[0]?.clientX ?? null }}
            onTouchEnd={(e) => {
              if (touchStartXRef.current === null) return
              const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current
              touchStartXRef.current = null
              if (Math.abs(delta) > 45) {
                if (delta < 0) nextPhoto()
                else prevPhoto()
              }
            }}
          >
            {photos.length > 1 && (
              <button type="button" className={`${styles.navBtn} ${styles.navPrev}`} onClick={prevPhoto} aria-label="Foto anterior">
                <ChevronLeft size={32} />
              </button>
            )}

            <div className={styles.modalImageStage}>
              {!isCurrentPhotoLoaded && (
                <div className={styles.modalSpinnerOverlay} aria-hidden="true">
                  <Loader2 size={36} className={styles.modalSpinner} />
                </div>
              )}

              <SmartImage
                key={currentPhoto}
                src={currentPhoto}
                alt={`${property.title} - Foto ${safeIndex + 1}`}
                className={styles.modalImg}
                fill
                priority
                quality={85}
                sizes="(max-width: 768px) 96vw, 85vw"
                style={{
                  objectFit: 'contain',
                  opacity: isCurrentPhotoLoaded ? 1 : 0,
                  transition: 'opacity 0.18s ease-out',
                }}
                onLoad={() => markPhotoLoaded(currentPhoto)}
                onError={() => markPhotoLoaded(currentPhoto)}
              />
            </div>

            {photos.length > 1 && (
              <button type="button" className={`${styles.navBtn} ${styles.navNext}`} onClick={nextPhoto} aria-label="Próxima foto">
                <ChevronRight size={32} />
              </button>
            )}

            {/* Pré-carregamento oculto das fotos adjacentes usando exatamente o mesmo URL otimizado */}
            <div className={styles.preloadBucket} aria-hidden="true">
              {adjacentUrls.map((url) => (
                <SmartImage
                  key={`preload-${url}`}
                  src={url}
                  alt=""
                  fill
                  loading="eager"
                  quality={85}
                  sizes="(max-width: 768px) 96vw, 85vw"
                  onLoad={() => markPhotoLoaded(url)}
                  onError={() => markPhotoLoaded(url)}
                />
              ))}
            </div>
          </div>

          {/* Barra Inferior de Miniaturas para navegação direta */}
          {photos.length > 1 && (
            <div className={styles.thumbsStrip} ref={thumbsContainerRef}>
              {photos.map((thumbUrl, idx) => (
                <button
                  key={`${thumbUrl}-${idx}`}
                  type="button"
                  aria-label={`Ir para foto ${idx + 1}`}
                  className={`${styles.thumbItem} ${idx === safeIndex ? styles.thumbItemActive : ''}`}
                  onClick={() => setActivePhotoIndex(idx)}
                >
                  <SmartImage
                    src={thumbUrl}
                    alt={`Miniatura ${idx + 1}`}
                    fill
                    quality={75}
                    sizes="72px"
                    style={{ objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal do Mapa - o componente gerencia o portal internamente */}
      <PropertyMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        latitude={property.latitude}
        longitude={property.longitude}
        address={property.location}
        propertyTitle={property.title}
        propertyCode={property.code}
      />

    </div>
  )
}
