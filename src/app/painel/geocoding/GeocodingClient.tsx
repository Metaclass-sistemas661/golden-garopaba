'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Globe, CheckCircle2, XCircle, Loader2, RefreshCw,
  ExternalLink, Play, SkipForward, AlertTriangle, Navigation,
} from 'lucide-react'
import { bulkGeocodeProperties, geocodePropertyById, type BulkGeocodeResult } from '@/app/actions/geocoding'
import styles from './geocoding.module.css'

interface PropertyGeoData {
  id: string; code: string; title: string; location: string | null
  latitude: number | null; longitude: number | null
  street: string | null; number: string | null
  neighborhood: string | null; city: string | null; state: string | null
}
interface GeocodingStats { total: number; withCoords: number; withoutCoords: number }
type RetryStatus = 'idle' | 'loading' | 'success' | 'error'

function getAddress(p: PropertyGeoData): string {
  const parts = [p.street, p.number, p.neighborhood, p.city, p.state].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : (p.location || 'Sem endereço cadastrado')
}

export default function GeocodingClient() {
  const [properties, setProperties] = useState<PropertyGeoData[]>([])
  const [stats, setStats] = useState<GeocodingStats>({ total: 0, withCoords: 0, withoutCoords: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bulkResult, setBulkResult] = useState<BulkGeocodeResult | null>(null)
  const [retryStatus, setRetryStatus] = useState<Record<string, RetryStatus>>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      setLoading(true); setError(null)
      const res = await fetch('/api/admin/properties-geo', { cache: 'no-store' })
      if (!res.ok) throw new Error('Erro ao carregar dados dos imóveis')
      const data = await res.json()
      setProperties(data.properties); setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally { setLoading(false) }
  }

  function handleBulkGeocode() {
    startTransition(async () => {
      const result = await bulkGeocodeProperties()
      setBulkResult(result); await loadData()
    })
  }

  function handleRetry(id: string) {
    setRetryStatus(prev => ({ ...prev, [id]: 'loading' }))
    geocodePropertyById(id).then(result => {
      setRetryStatus(prev => ({ ...prev, [id]: result.success ? 'success' : 'error' }))
      if (result.success && result.coords) {
        setProperties(prev => prev.map(p =>
          p.id === id ? { ...p, latitude: result.coords!.lat, longitude: result.coords!.lng } : p
        ))
        setStats(prev => ({ ...prev, withCoords: prev.withCoords + 1, withoutCoords: prev.withoutCoords - 1 }))
      }
    })
  }

  const withoutCoords = properties.filter(p => p.latitude === null || p.longitude === null)
  const withCoords    = properties.filter(p => p.latitude !== null && p.longitude !== null)

  if (loading) return (
    <div className={styles.loadingState}>
      <Loader2 size={32} color="#94a3b8" className={styles.spin} />
      <p className={styles.loadingText}>Carregando dados de geocoding…</p>
    </div>
  )

  if (error) return (
    <div className={styles.errorState}>
      <AlertTriangle size={32} color="#ef4444" />
      <p className={styles.errorText}>{error}</p>
      <button className={styles.retryLargeBtn} onClick={loadData}>
        <RefreshCw size={15} /> Tentar novamente
      </button>
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>
            <Globe size={24} className={styles.titleIcon} />
            Geocoding de Imóveis
          </h1>
          <p className={styles.subtitle}>
            Converta endereços em coordenadas geográficas para exibição no mapa
          </p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardBlue}`}>
          <span className={styles.statLabel}><Navigation size={14} /> Total de Imóveis</span>
          <span className={`${styles.statValue} ${styles.statValueBlue}`}>{stats.total}</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
          <span className={styles.statLabel}><CheckCircle2 size={14} /> Com Coordenadas</span>
          <span className={`${styles.statValue} ${styles.statValueGreen}`}>{stats.withCoords}</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardRed}`}>
          <span className={styles.statLabel}><XCircle size={14} /> Sem Coordenadas</span>
          <span className={`${styles.statValue} ${styles.statValueRed}`}>{stats.withoutCoords}</span>
        </div>
      </div>

      <div className={styles.actionCard}>
        <div className={styles.actionHeader}>
          <div className={styles.actionIconWrapper}><Globe size={18} /></div>
          <h2 className={styles.actionTitle}>Geocoding em Lote</h2>
        </div>

        {withoutCoords.length === 0 ? (
          <div className={styles.allDoneBanner}>
            <CheckCircle2 size={18} />
            Todos os imóveis já possuem coordenadas geográficas.
          </div>
        ) : (
          <div className={styles.pendingBanner}>
            <AlertTriangle size={18} />
            {withoutCoords.length} {withoutCoords.length === 1 ? 'imóvel ainda não possui' : 'imóveis ainda não possuem'} coordenadas.
          </div>
        )}

        <button
          className={styles.bulkBtn}
          onClick={handleBulkGeocode}
          disabled={isPending || withoutCoords.length === 0}
        >
          {isPending
            ? <><Loader2 size={16} className={styles.spin} /> Processando…</>
            : <><Play size={16} /> Geocodificar {withoutCoords.length > 0 ? withoutCoords.length : 'todos'}</>
          }
        </button>

        {bulkResult && (
          <div className={styles.resultsBanner}>
            <span className={`${styles.resultItem} ${styles.resultSuccess}`}>
              <CheckCircle2 size={15} /> {bulkResult.geocoded} geocodificados
            </span>
            <span className={`${styles.resultItem} ${styles.resultFailed}`}>
              <XCircle size={15} /> {bulkResult.failed} com falha
            </span>
            <span className={`${styles.resultItem} ${styles.resultSkipped}`}>
              <SkipForward size={15} /> {bulkResult.skipped} ignorados
            </span>
          </div>
        )}
      </div>

      {withoutCoords.length > 0 && (
        <div className={styles.section}>
          <h2 className={`${styles.sectionHeader} ${styles.sectionHeaderRed}`}>
            <XCircle size={18} />
            Sem Coordenadas
            <span className={styles.sectionCount}>({withoutCoords.length})</span>
          </h2>
          <div className={styles.listCard}>
            {withoutCoords.map(p => {
              const st = retryStatus[p.id] || 'idle'
              return (
                <div
                  key={p.id}
                  className={`${styles.propertyRow} ${st === 'error' ? styles.propertyRowError : ''}`}
                >
                  <span className={styles.statusIcon}><XCircle size={16} color="#ef4444" /></span>
                  <span className={styles.propCode}>{p.code}</span>
                  <span className={styles.propTitle}>{p.title}</span>
                  <span className={styles.propAddress}>{getAddress(p)}</span>
                  <button
                    className={`${styles.retryBtn} ${st === 'success' ? styles.retryBtnSuccess : ''}`}
                    onClick={() => handleRetry(p.id)}
                    disabled={st === 'loading' || st === 'success'}
                  >
                    {st === 'loading'
                      ? <Loader2 size={12} className={styles.spin} />
                      : st === 'success'
                        ? <><CheckCircle2 size={12} /> Salvo</>
                        : <><RefreshCw size={12} /> Tentar</>
                    }
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {withCoords.length > 0 && (
        <div className={styles.section}>
          <h2 className={`${styles.sectionHeader} ${styles.sectionHeaderGreen}`}>
            <CheckCircle2 size={18} />
            Com Coordenadas
            <span className={styles.sectionCount}>({withCoords.length})</span>
          </h2>
          <div className={styles.listCard}>
            {withCoords.slice(0, 20).map(p => (
              <div key={p.id} className={`${styles.propertyRow} ${styles.propertyRowSuccess}`}>
                <span className={styles.statusIcon}><CheckCircle2 size={16} color="#10b981" /></span>
                <span className={styles.propCode}>{p.code}</span>
                <span className={styles.propTitle}>{p.title}</span>
                <span className={styles.propAddress}>{getAddress(p)}</span>
                <span className={styles.propCoords}>
                  {p.latitude?.toFixed(5)}, {p.longitude?.toFixed(5)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.mapsLink}
                >
                  <ExternalLink size={12} /> Maps
                </a>
              </div>
            ))}
            {withCoords.length > 20 && (
              <div className={styles.showMore}>
                + {withCoords.length - 20} imóveis adicionais com coordenadas
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

