'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

/**
 * Verifica se estamos no ambiente do navegador (client-side).
 * Necessário para createPortal funcionar corretamente com SSR do Next.js.
 */
function canUseDOM(): boolean {
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined' && 
         document.body !== null
}

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
                <div className={styles.enterpriseMarker}>
                  <div className={styles.markerPulse} />
                  <div className={styles.markerPulse2} />
                  <div className={styles.markerBody}>
                    <svg width="52" height="64" viewBox="0 0 52 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="pinGrad" x1="0" y1="0" x2="52" y2="64" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#f5d060" />
                          <stop offset="100%" stopColor="#b8963a" />
                        </linearGradient>
                        <filter id="pinShadow" x="-30%" y="-10%" width="160%" height="160%">
                          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.45" />
                        </filter>
                      </defs>
                      <path
                        d="M26 2C14.954 2 6 10.954 6 22C6 35.5 26 62 26 62C26 62 46 35.5 46 22C46 10.954 37.046 2 26 2Z"
                        fill="url(#pinGrad)"
                        filter="url(#pinShadow)"
                      />
                      <circle cx="26" cy="22" r="11" fill="#0f172a" opacity="0.9" />
                      <path d="M26 13L18 20V30H22V25H30V30H34V20L26 13Z" fill="#f5d060" />
                    </svg>
                  </div>
                  <div className={styles.markerShadowDot} />
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

  // Controla o overflow do body quando o modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { 
      document.body.style.overflow = '' 
    }
  }, [isOpen])

  // Não renderiza nada se o modal está fechado ou estamos no servidor
  if (!isOpen || !canUseDOM()) return null

  // Renderiza o modal via portal diretamente no document.body
  return createPortal(
    <GoogleMapsProvider>
      <PropertyMapContent {...props} onClose={onClose} />
    </GoogleMapsProvider>,
    document.body
  )
}
