'use client'

import { useState, useEffect, useMemo } from 'react'
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { X, MapPin, Home, ArrowLeft, Navigation, ExternalLink, Loader2 } from 'lucide-react'
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
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function MapContent({ properties, onClose, mode }: Omit<PropertiesMapViewProps, 'isOpen'>) {
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap')

  // Filtra propriedades com coordenadas válidas
  const propertiesWithCoords = useMemo(() => 
    properties.filter(p => 
      p.latitude !== null && p.longitude !== null && 
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

  // Calcula centro do mapa baseado nas propriedades
  const mapCenter = useMemo(() => {
    if (propertiesWithCoords.length > 0) {
      const lats = propertiesWithCoords.map(p => p.latitude!)
      const lngs = propertiesWithCoords.map(p => p.longitude!)
      return { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 }
    }
    return userLocation || GAROPABA_CENTER
  }, [propertiesWithCoords, userLocation])

  const getModeTitle = () => {
    if (mode === 'SALE') return 'Imóveis à Venda'
    if (mode === 'RENT') return 'Imóveis para Locação'
    return 'Lançamentos'
  }

  const handleGetDirections = (property: PropertyDTO) => {
    if (property.latitude && property.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`, '_blank')
    }
  }

  const handleOpenInMaps = (property: PropertyDTO) => {
    if (property.latitude && property.longitude) {
      window.open(`https://www.google.com/maps?q=${property.latitude},${property.longitude}`, '_blank')
    }
  }

  return (
    <div className={styles.propertiesMapContainer}>
      {/* Header com botão Voltar */}
      <div className={styles.propertiesMapHeader}>
        <button className={styles.backBtn} onClick={onClose}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>
        <div className={styles.propertiesMapTitle}>
          <MapPin size={20} />
          <span>{getModeTitle()}</span>
          <span className={styles.mapCount}>({propertiesWithCoords.length} no mapa)</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
      </div>

      {/* Controles do mapa */}
      <div className={styles.mapControlsInline}>
        <div className={styles.mapTypeSelector}>
          <button className={`${styles.mapTypeBtn} ${mapType === 'roadmap' ? styles.active : ''}`} onClick={() => setMapType('roadmap')}>Mapa</button>
          <button className={`${styles.mapTypeBtn} ${mapType === 'satellite' ? styles.active : ''}`} onClick={() => setMapType('satellite')}>Satélite</button>
          <button className={`${styles.mapTypeBtn} ${mapType === 'hybrid' ? styles.active : ''}`} onClick={() => setMapType('hybrid')}>Híbrido</button>
        </div>
      </div>

      <div className={styles.propertiesMapContent}>
        <div className={styles.mapArea}>
          {isLoading && (
            <div className={styles.mapLoading}>
              <Loader2 size={48} className={styles.spinner} />
              <span>Carregando mapa...</span>
            </div>
          )}
          
          {propertiesWithCoords.length === 0 && !isLoading && (
            <div className={styles.noPropertiesMessage}>
              <MapPin size={48} />
              <h3>Nenhum imóvel com localização</h3>
              <p>Os imóveis nesta categoria ainda não possuem coordenadas cadastradas.</p>
              <p className={styles.hint}>As coordenadas são geradas automaticamente ao salvar um imóvel.</p>
            </div>
          )}

          <Map defaultZoom={propertiesWithCoords.length > 0 ? 12 : 13} defaultCenter={mapCenter} mapId="golden-properties-map"
            mapTypeId={mapType} gestureHandling="greedy" disableDefaultUI={false} zoomControl={true} streetViewControl={false} fullscreenControl={true}>
            {propertiesWithCoords.map((property) => (
              <AdvancedMarker key={property.id} position={{ lat: property.latitude!, lng: property.longitude! }} onClick={() => setSelectedProperty(property)}>
                <div className={`${styles.priceMarker} ${selectedProperty?.id === property.id ? styles.active : ''}`}>
                  <Home size={14} />
                  {formatPrice(Number(property.price) || Number(property.rentPrice) || 0)}
                </div>
              </AdvancedMarker>
            ))}
            {selectedProperty && selectedProperty.latitude && (
              <InfoWindow position={{ lat: selectedProperty.latitude, lng: selectedProperty.longitude! }} onCloseClick={() => setSelectedProperty(null)}>
                <div className={styles.infoWindowContent}>
                  <strong>{selectedProperty.title}</strong>
                  <p>Código: {selectedProperty.code}</p>
                  <p>{selectedProperty.location}</p>
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
          <div className={styles.sidebarHeader}>
            <h3>Imóveis na região</h3>
            <p>{propertiesWithCoords.length} resultados</p>
          </div>
          {propertiesWithCoords.length === 0 ? (
            <div className={styles.emptySidebar}><p>Nenhum imóvel com localização.</p></div>
          ) : (
            propertiesWithCoords.map((property) => (
              <div key={property.id} className={`${styles.propertyListItem} ${selectedProperty?.id === property.id ? styles.active : ''}`} onClick={() => setSelectedProperty(property)}>
                <div className={styles.propertyThumb}>
                  <Image src={property.photos[0] || '/placeholder.jpg'} alt={property.title} fill style={{ objectFit: 'cover' }} unoptimized />
                </div>
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
