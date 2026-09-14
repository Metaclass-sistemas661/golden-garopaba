'use client'

import { useState, useEffect, useMemo } from 'react'
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { X, MapPin, Home } from 'lucide-react'
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

  const propertiesWithCoords = useMemo(() => 
    properties.filter(p => p.latitude && p.longitude), [properties])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  const mapCenter = userLocation || GAROPABA_CENTER
  const getModeTitle = () => {
    if (mode === 'SALE') return 'Imóveis à Venda'
    if (mode === 'RENT') return 'Imóveis para Locação'
    return 'Lançamentos'
  }

  return (
    <div className={styles.propertiesMapContainer}>
      <div className={styles.propertiesMapHeader}>
        <div className={styles.propertiesMapTitle}>
          <MapPin size={20} />
          <span>{getModeTitle()}</span>
          <span style={{fontWeight: 400, color: '#94a3b8'}}>({propertiesWithCoords.length} no mapa)</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
      </div>

      <div className={styles.propertiesMapContent}>
        <div className={styles.mapArea}>
          <Map defaultZoom={userLocation ? 13 : 12} defaultCenter={mapCenter} mapId="golden-properties-map"
            gestureHandling="greedy" disableDefaultUI={false} zoomControl={true} streetViewControl={false} fullscreenControl={true}>
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
                <Link href={`/imoveis/${selectedProperty.id}`} className={styles.infoWindowContent}>
                  <strong>{selectedProperty.title}</strong>
                  <p>Código: {selectedProperty.code}</p>
                  <p>{selectedProperty.location}</p>
                </Link>
              </InfoWindow>
            )}
          </Map>
        </div>
        <div className={styles.propertySidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Imóveis na região</h3>
            <p>{propertiesWithCoords.length} resultados</p>
          </div>
          {propertiesWithCoords.map((property) => (
            <div key={property.id} className={`${styles.propertyListItem} ${selectedProperty?.id === property.id ? styles.active : ''}`} onClick={() => setSelectedProperty(property)}>
              <div className={styles.propertyThumb}>
                <Image src={property.photos[0] || '/placeholder.jpg'} alt={property.title} fill style={{ objectFit: 'cover' }} unoptimized />
              </div>
              <div className={styles.propertyListInfo}>
                <h4>{property.title}</h4>
                <div className={styles.location}><MapPin size={12} />{property.location}</div>
                <div className={styles.price}>{formatPrice(Number(property.price) || Number(property.rentPrice) || 0)}</div>
              </div>
            </div>
          ))}
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
