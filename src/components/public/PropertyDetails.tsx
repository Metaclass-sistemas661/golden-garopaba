"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Bed, Bath, Square, Car, Check, Share2, Heart, MessageCircle, Home, X, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react'
import styles from './PropertyDetails.module.css'

interface PropertyDetailsProps {
  property: any
  similarProperties: any[]
}

export default function PropertyDetails({ property, similarProperties }: PropertyDetailsProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const openGallery = (index: number) => {
    setActivePhotoIndex(index)
    setIsGalleryOpen(true)
  }

  const closeGallery = () => setIsGalleryOpen(false)

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev === property.photos.length - 1 ? 0 : prev + 1))
  }

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev === 0 ? property.photos.length - 1 : prev - 1))
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    alert("Link copiado para a área de transferência!")
  }

  const handleMap = () => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(property.location)}`, '_blank')
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const handleWhatsappClick = () => {
    // Número placeholder (será dinâmico no futuro via admin)
    const phoneNumber = "5511999999999" 
    const message = encodeURIComponent(`Olá, vi o imóvel código ${property.code} (${property.title}) no site e gostaria de mais informações.`)
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  const allAmenities = [
    ...(property.features || []),
    ...(property.leisure || []),
    ...(property.security || []),
    ...(property.furniture || []),
    ...(property.environments || []),
    ...(property.infrastructure || [])
  ]

  return (
    <div className={styles.container}>
      
      {/* 1. Galeria de Imagens (Grid Assimétrico) */}
      <section className={styles.gallerySection}>
        <div className={styles.galleryGrid}>
          {/* Foto Principal Esquerda */}
          <div className={styles.mainPhotoWrapper} onClick={() => openGallery(0)} style={{cursor: 'pointer'}}>
            <img 
              src={property.photos[0] || '/placeholder.jpg'} 
              alt={property.title} 
              className={styles.mainPhoto}
            />
            {property.status !== 'AVAILABLE' && (
               <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '3rem', letterSpacing: '4px', textTransform: 'uppercase', zIndex: 10 }}>
                 {property.status === 'SOLD' ? 'Vendido' : 'Alugado'}
               </div>
            )}
            <div className={styles.photoOverlayTags}>
              <button className={styles.overlayBtn} onClick={() => openGallery(0)}>
                <Home size={16} /> Fotos ({property.photos.length})
              </button>
              <button className={styles.overlayBtn} onClick={handleMap}>
                <MapPin size={16} /> Mapa
              </button>
            </div>
          </div>
          
          {/* Fotos Menores Direita */}
          <div className={styles.sidePhotos}>
            <div className={styles.sidePhotoWrapper} onClick={() => openGallery(1)} style={{cursor: 'pointer'}}>
              <img 
                src={property.photos[1] || property.photos[0]} 
                alt={`${property.title} - Foto 2`} 
                className={styles.sidePhoto}
              />
            </div>
            <div className={styles.sidePhotoWrapper} onClick={() => openGallery(2)} style={{cursor: 'pointer'}}>
              <img 
                src={property.photos[2] || property.photos[0]} 
                alt={`${property.title} - Foto 3`} 
                className={styles.sidePhoto}
              />
              <div className={styles.viewMoreOverlay}>
                <span>+ Ver mais</span>
              </div>
            </div>
          </div>
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
                className={`${styles.iconBtn} ${isFavorite ? styles.favoriteActive : ''}`} 
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
              </button>
              <button className={styles.iconBtn} onClick={handleShare}>
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {property.status === 'AVAILABLE' && (
            <div className={styles.priceSection}>
              <span className={styles.transactionType}>
                {property.transactionType === 'SALE' ? 'Comprar' : property.transactionType === 'RENT' ? 'Alugar' : 'Lançamento'}
              </span>
              <h2 className={styles.price}>
                {property.transactionType === 'RENT' 
                  ? (property.rentPrice ? `${formatPrice(property.rentPrice)}/mês` : 'Sob Consulta')
                  : (property.price > 0 
                      ? formatPrice(property.price) 
                      : (property.rentPrice > 0 ? `${formatPrice(property.rentPrice)}/mês` : 'Sob Consulta'))}
              </h2>
              
              {(property.condoPrice || property.iptuPrice) && (
                <div className={styles.additionalCosts}>
                  {property.condoPrice ? <span>Condomínio: <strong>{formatPrice(property.condoPrice)}</strong></span> : null}
                  {property.condoPrice && property.iptuPrice ? <span className={styles.costSeparator}>•</span> : null}
                  {property.iptuPrice ? <span>IPTU: <strong>{formatPrice(property.iptuPrice)}</strong></span> : null}
                </div>
              )}
            </div>
          )}

          {/* Grid de Especificações */}
          <div className={styles.specsGrid}>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Área total</span>
              <span className={styles.specValue}><Square size={18} /> {property.areaTotal || 0} m²</span>
            </div>
            {property.areaUseful && (
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Área útil</span>
                <span className={styles.specValue}><Square size={18} /> {property.areaUseful} m²</span>
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
              dangerouslySetInnerHTML={{ __html: property.description || '' }}
            />
          </div>

          {/* Comodidades */}
          {allAmenities.length > 0 && (
            <div className={styles.amenitiesSection}>
              <h3>Comodidades do imóvel</h3>
              <div className={styles.amenitiesGrid}>
                {allAmenities.map(amenity => (
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
                
                <button className={styles.whatsappBtn} onClick={handleWhatsappClick}>
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
            {similarProperties.map(sim => (
              <Link href={`/imoveis/${sim.id}`} key={sim.id} className={styles.propertyCard}>
                <div className={styles.cardImageWrapper}>
                  <img src={sim.photos && sim.photos.length > 0 ? sim.photos[0] : '/placeholder.jpg'} alt={sim.title} />
                  <div className={styles.cardTag}>{sim.transactionType === 'SALE' ? 'Venda' : 'Aluguel'}</div>
                </div>
                <div className={styles.cardContent}>
                  <h4>{sim.title}</h4>
                  <p className={styles.cardLoc}>{sim.location}</p>
                  <div className={styles.cardFeatures}>
                    <span>{sim.areaTotal || 0}m²</span>
                    <span>{sim.bedrooms || 0} quartos</span>
                    <span>{sim.bathrooms || 0} banheiros</span>
                    <span>{sim.parkingSpaces || 0} vagas</span>
                  </div>
                  <div className={styles.cardPrice}>
                    {sim.transactionType === 'SALE' ? 'Comprar' : 'Alugar'}
                    <strong>{formatPrice(sim.price)}</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {/* Galeria FullScreen (Modal) */}
      {isGalleryOpen && (
        <div className={styles.galleryModal}>
          <div className={styles.modalOverlay} onClick={closeGallery}></div>
          <button className={styles.closeBtn} onClick={closeGallery}><X size={32} /></button>
          
          <div className={styles.modalContent}>
            <button className={styles.navBtn} onClick={prevPhoto}><ChevronLeft size={36} /></button>
            
            <img 
              src={property.photos[activePhotoIndex]} 
              alt={`Foto ${activePhotoIndex + 1}`} 
              className={styles.modalImg}
            />
            
            <button className={styles.navBtn} onClick={nextPhoto}><ChevronRight size={36} /></button>
          </div>
          
          <div className={styles.photoCounter}>
            {activePhotoIndex + 1} / {property.photos.length}
          </div>
        </div>
      )}

    </div>
  )
}
