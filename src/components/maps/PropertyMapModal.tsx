'use client'

import { useState, useEffect } from 'react'
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { X, MapPin, Navigation, ExternalLink } from 'lucide-react'
import styles from './maps.module.css'
import GoogleMapsProvider from './GoogleMapsProvider'

interface PropertyMapModalProps {
  isOpen: boolean
  onClose: () => void
  latitude?: number | null
  longitude?: number | null
  address?: string | null
  propertyTitle: string
  propertyCode: string
}

const GAROPABA_CENTER = { lat: -28.0275, lng: -48.6178 }

function PropertyMapContent({ 
  latitude, 
  longitude, 
  address, 
  propertyTitle,
  propertyCode,
  onClose 
}: Omit<PropertyMapModalProps, 'isOpen'>) {
  const [showInfoWindow, setShowInfoWindow] = useState(true)
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap')

  const hasCoordinates = latitude && longitude
  const position = hasCoordinates 
    ? { lat: latitude, lng: longitude }
    : GAROPABA_CENTER

  const handleGetDirections = () => {
    const destination = hasCoordinates 
      ? `${latitude},${longitude}`
      : encodeURIComponent(address || 'Garopaba, SC')
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank')
  }

  const handleOpenInGoogleMaps = () => {
    if (hasCoordinates) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')
    } else if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank')
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <MapPin size={20} />
            <span>Localização do Imóvel</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
        </div>

        <div className={styles.mapControls}>
          <div className={styles.mapTypeSelector}>
            <button className={`${styles.mapTypeBtn} ${mapType === 'roadmap' ? styles.active : ''}`} onClick={() => setMapType('roadmap')}>Mapa</button>
            <button className={`${styles.mapTypeBtn} ${mapType === 'satellite' ? styles.active : ''}`} onClick={() => setMapType('satellite')}>Satélite</button>
            <button className={`${styles.mapTypeBtn} ${mapType === 'hybrid' ? styles.active : ''}`} onClick={() => setMapType('hybrid')}>Híbrido</button>
          </div>
          <div className={styles.mapActions}>
            <button className={styles.actionBtn} onClick={handleGetDirections}><Navigation size={18} /><span>Como chegar</span></button>
            <button className={styles.actionBtn} onClick={handleOpenInGoogleMaps}><ExternalLink size={18} /><span>Google Maps</span></button>
          </div>
        </div>

        <div className={styles.mapWrapper}>
          {!hasCoordinates && (
            <div className={styles.noCoordinatesOverlay}>
              <MapPin size={32} />
              <p>Localização aproximada</p>
              <span>Coordenadas exatas não disponíveis</span>
            </div>
          )}
          
          <Map
            defaultZoom={hasCoordinates ? 17 : 14}
            defaultCenter={position}
            mapId="golden-properties-map"
            mapTypeId={mapType}
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            streetViewControl={true}
            fullscreenControl={true}
            style={{ width: '100%', height: '100%' }}
          >
            {hasCoordinates && (
              <AdvancedMarker position={position} onClick={() => setShowInfoWindow(true)}>
                <div className={styles.customMarker}>
                  <div className={styles.markerIcon}>
                    <MapPin size={28} fill="#d4af37" color="#0f172a" />
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {showInfoWindow && hasCoordinates && (
              <InfoWindow position={position} onCloseClick={() => setShowInfoWindow(false)}>
                <div className={styles.infoWindowContent}>
                  <strong>{propertyTitle}</strong>
                  <p>Código: {propertyCode}</p>
                  {address && <p className={styles.infoAddress}>{address}</p>}
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>

        {address && (
          <div className={styles.modalFooter}>
            <MapPin size={16} />
            <span>{address}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PropertyMapModal(props: PropertyMapModalProps) {
  const { isOpen, onClose } = props

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <GoogleMapsProvider>
      <PropertyMapContent {...props} onClose={onClose} />
    </GoogleMapsProvider>
  )
}
