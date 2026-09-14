'use client'

import { useState, useEffect, useMemo } from 'react'
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { X, MapPin, ArrowLeft, Navigation, ExternalLink, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './maps.module.css'
import GoogleMapsProvider from './GoogleMapsProvider'
import { PropertyDTO } from '@/types/dto'

interface PropertiesMapViewProps {
  isOpen: boolean
  onClose: () => void
  properties: PropertyDTO[]
  mode: 'SALE' | 'RENT' | 'LANCAMENTO'
}

const GAROPABA_CENTER = { lat: -28.0275, lng: -48.6178 }

const formatPrice = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function MapContent({ properties, onClose, mode }: Omit<PropertiesMapViewProps, 'isOpen'>) {
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap')

  const propertiesWithCoords = useMemo(() => properties.filter(
    (p) => p.latitude !== null && p.longitude !== null &&
      typeof p.latitude === 'number' && typeof p.longitude === 'number' &&
      !isNaN(p.latitude) && !isNaN(p.longitude)
  ), [properties])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  const mapCenter = useMemo(() => {
    if (propertiesWithCoords.length > 0) {
      const lats = propertiesWithCoords.map((p) => p.latitude!)
      const lngs = propertiesWithCoords.map((p) => p.longitude!)
      return { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 }
    }
    return userLocation || GAROPABA_CENTER
  }, [propertiesWithCoords, userLocation])

  const getModeTitle = () => {
    if (mode === 'SALE') return 'Imóveis à Venda'
    if (mode === 'RENT') return 'Imóveis para Locação'
    return 'Lançamentos'
  }

  const handleGetDirections = (p: PropertyDTO) => {
    if (p.latitude && p.longitude) window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`, '_blank')
  }

  const handleOpenInMaps = (p: PropertyDTO) => {
    if (p.latitude && p.longitude) window.open(`https://www.google.com/maps?q=${p.latitude},${p.longitude}`, '_blank')
  }

  return (
    <div className={styles.propertiesMapContainer}>
      <div className={styles.propertiesMapHeader}>
        <button className={styles.backBtn} onClick={onClose}><ArrowLeft size={20} /><span>Voltar</span></button>
        <div className={styles.propertiesMapTitle}>
          <MapPin size={20} /><span>{getModeTitle()}</span>
          <span className={styles.mapCount}>({propertiesWithCoords.length} no mapa)</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
      </div>
      <div className={styles.mapControlsInline}>
        <div className={styles.mapTypeSelector}>
          <button className={`${styles.mapTypeBtn} ${mapType === 'roadmap' ? styles.active : ''}`} onClick={() => setMapType('roadmap')}>Mapa</button>
          <button className={`${styles.mapTypeBtn} ${mapType === 'satellite' ? styles.active : ''}`} onClick={() => setMapType('satellite')}>Satélite</button>
          <button className={`${styles.mapTypeBtn} ${mapType === 'hybrid' ? styles.active : ''}`} onClick={() => setMapType('hybrid')}>Híbrido</button>
        </div>
      </div>
      <div className={styles.propertiesMapContent}>
        <div className={styles.mapArea}>
          {isLoading && <div className={styles.mapLoading}><Loader2 size={48} className={styles.spinner} /><span>Carregando mapa...</span></div>}
          {propertiesWithCoords.length === 0 && !isLoading && (
            <div className={styles.noPropertiesMessage}>
              <MapPin size={48} /><h3>Nenhum imóvel com localização</h3>
              <p>Os imóveis nesta categoria ainda não possuem coordenadas cadastradas.</p>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>As coordenadas são geradas automaticamente ao salvar um imóvel.</p>
              <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Acesse o Painel → Geocodificação para processar todos de uma vez.</p>
            </div>
          )}
          <Map defaultZoom={propertiesWithCoords.length > 0 ? 12 : 13} defaultCenter={mapCenter} mapId="golden-properties-map" mapTypeId={mapType} gestureHandling="greedy" disableDefaultUI={false} zoomControl={true} streetViewControl={false} fullscreenControl={true}>
            {propertiesWithCoords.map((property) => {
              const isActive = selectedProperty?.id === property.id
              const price = formatPrice(Number(property.price) || Number(property.rentPrice) || 0)
              return (
                <AdvancedMarker
                  key={property.id}
                  position={{ lat: property.latitude!, lng: property.longitude! }}
                  onClick={() => setSelectedProperty(property)}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    filter: isActive
                      ? 'drop-shadow(0 0 8px rgba(212,175,55,0.8))'
                      : 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))',
                    transform: isActive ? 'scale(1.12)' : 'scale(1)',
                    transition: 'transform 0.15s, filter 0.15s',
                  }}>
                    {/* Pill com preço */}
                    <div style={{
                      background: isActive
                        ? 'linear-gradient(135deg, #f5d060, #d4af37)'
                        : 'linear-gradient(135deg, #1e293b, #0f172a)',
                      border: `2px solid ${isActive ? '#f5d060' : '#d4af37'}`,
                      color: isActive ? '#0f172a' : '#f1f5f9',
                      padding: '5px 11px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      letterSpacing: '0.02em',
                      lineHeight: '1.2',
                      boxShadow: isActive
                        ? '0 0 0 3px rgba(212,175,55,0.35), inset 0 1px 0 rgba(255,255,255,0.3)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.07)',
                    }}>
                      {price}
                    </div>
                    {/* Seta apontando para a localização */}
                    <div style={{
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: `6px solid ${isActive ? '#f5d060' : '#d4af37'}`,
                    }} />
                  </div>
                </AdvancedMarker>
              )
            })}
            {selectedProperty && selectedProperty.latitude && (
              <InfoWindow position={{ lat: selectedProperty.latitude, lng: selectedProperty.longitude! }} onCloseClick={() => setSelectedProperty(null)}>
                <div className={styles.infoWindowContent}>
                  <strong>{selectedProperty.title}</strong><p>Código: {selectedProperty.code}</p><p>{selectedProperty.location}</p>
                  <div className={styles.infoWindowActions}>
                    <button onClick={() => handleGetDirections(selectedProperty)}><Navigation size={14} /> Rota</button>
                    <Link href={`/imoveis/${selectedProperty.id}`}>Ver detalhes →</Link>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
        <div className={styles.propertySidebar}>
          <div className={styles.sidebarHeader}><h3>Imóveis na região</h3><p>{propertiesWithCoords.length} resultados</p></div>
          {propertiesWithCoords.length === 0 ? (
            <div className={styles.emptySidebar}><p>Nenhum imóvel com localização.</p></div>
          ) : (
            propertiesWithCoords.map((property) => (
              <div key={property.id} className={`${styles.propertyListItem} ${selectedProperty?.id === property.id ? styles.active : ''}`} onClick={() => setSelectedProperty(property)}>
                <div className={styles.propertyThumb}><Image src={property.photos[0] || '/placeholder.jpg'} alt={property.title} fill style={{ objectFit: 'cover' }} unoptimized /></div>
                <div className={styles.propertyListInfo}>
                  <h4>{property.title}</h4>
                  <div className={styles.location}><MapPin size={12} />{property.location}</div>
                  <div className={styles.price}>{formatPrice(Number(property.price) || Number(property.rentPrice) || 0)}</div>
                  <div className={styles.listItemActions}>
                    <button className={styles.miniActionBtn} onClick={(e) => { e.stopPropagation(); handleGetDirections(property); }} title="Rota"><Navigation size={12} /></button>
                    <button className={styles.miniActionBtn} onClick={(e) => { e.stopPropagation(); handleOpenInMaps(property); }} title="Google Maps"><ExternalLink size={12} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function PropertiesMapView(props: PropertiesMapViewProps) {
  useEffect(() => {
    if (props.isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [props.isOpen])

  if (!props.isOpen) return null
  return <GoogleMapsProvider><MapContent {...props} /></GoogleMapsProvider>
}

