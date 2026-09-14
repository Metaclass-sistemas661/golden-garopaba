'use client'

import { useState, useEffect, useTransition } from 'react'
import { MapPin, CheckCircle2, XCircle, Loader2, RefreshCw, Map, AlertTriangle } from 'lucide-react'
import { bulkGeocodeProperties, geocodePropertyById, type BulkGeocodeResult } from '@/app/actions/geocoding'

interface PropertyGeoData {
  id: string
  code: string
  title: string
  location: string | null
  latitude: number | null
  longitude: number | null
  street: string | null
  number: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
}

interface GeocodingStats {
  total: number
  withCoords: number
  withoutCoords: number
}

type RetryStatus = 'idle' | 'loading' | 'success' | 'error'

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', borderLeft: `4px solid ${color}` }}>
      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{value}</p>
    </div>
  )
}

function getAddress(p: PropertyGeoData): string {
  const parts = [p.street, p.number, p.neighborhood, p.city, p.state].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : (p.location || 'Sem endereço')
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
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/properties-geo', { cache: 'no-store' })
      if (!res.ok) throw new Error('Erro ao carregar imóveis')
      const data = await res.json()
      setProperties(data.properties)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  function handleBulkGeocode() {
    startTransition(async () => {
      const result = await bulkGeocodeProperties()
      setBulkResult(result)
      await loadData()
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
  const withCoords = properties.filter(p => p.latitude !== null && p.longitude !== null)
  const spinStyle = { animation: 'spin 1s linear infinite' }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loader2 size={32} style={{ ...spinStyle, color: '#d4af37' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <p style={{ color: '#ef4444', fontSize: '1.1rem' }}>{error}</p>
        <button onClick={loadData} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <Map size={28} color="#d4af37" />
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Geocoding de Imóveis</h1>
      </div>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Converte endereços em coordenadas para exibir no mapa.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total" value={stats.total} color="#3b82f6" />
        <StatCard label="Com Coordenadas" value={stats.withCoords} color="#10b981" />
        <StatCard label="Sem Coordenadas" value={stats.withoutCoords} color="#ef4444" />
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Geocoding em Lote</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {withoutCoords.length === 0 ? '✅ Todos já possuem coordenadas!' : `Geocodifica ${withoutCoords.length} imóveis automaticamente.`}
        </p>
        <button onClick={handleBulkGeocode} disabled={isPending || withoutCoords.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.95rem', fontWeight: 600, border: 'none', borderRadius: 8, cursor: withoutCoords.length === 0 ? 'not-allowed' : 'pointer', background: withoutCoords.length === 0 ? '#94a3b8' : '#d4af37', color: '#0f172a' }}>
          {isPending ? <Loader2 size={18} style={spinStyle} /> : <MapPin size={18} />}
          {isPending ? 'Processando...' : `Geocodificar ${withoutCoords.length}`}
        </button>
        {bulkResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#10b981', fontWeight: 600 }}>✅ {bulkResult.geocoded}</span>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>❌ {bulkResult.failed}</span>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>⏭️ {bulkResult.skipped}</span>
            </div>
          </div>
        )}
      </div>

      {withoutCoords.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#ef4444' }}>Sem Coordenadas ({withoutCoords.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {withoutCoords.map(p => {
              const st = retryStatus[p.id] || 'idle'
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', background: '#fff', border: '1px solid #fecaca', borderRadius: 8, fontSize: '0.85rem', flexWrap: 'wrap' }}>
                  <XCircle size={16} color="#ef4444" />
                  <span style={{ fontWeight: 600, minWidth: 70 }}>{p.code}</span>
                  <span style={{ flex: 1, color: '#374151' }}>{p.title}</span>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{getAddress(p)}</span>
                  <button onClick={() => handleRetry(p.id)} disabled={st === 'loading' || st === 'success'}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #e2e8f0', borderRadius: 4, cursor: st === 'loading' || st === 'success' ? 'not-allowed' : 'pointer', background: st === 'success' ? '#10b981' : '#f8fafc', color: st === 'success' ? '#fff' : '#374151' }}>
                    {st === 'loading' ? <Loader2 size={12} style={spinStyle} /> : st === 'success' ? '✓' : <RefreshCw size={12} />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {withCoords.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#10b981' }}>Com Coordenadas ({withCoords.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {withCoords.slice(0, 15).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: '0.8rem' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span style={{ fontWeight: 600, minWidth: 70 }}>{p.code}</span>
                <span style={{ flex: 1, color: '#374151' }}>{p.title}</span>
                <span style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.latitude?.toFixed(5)}, {p.longitude?.toFixed(5)}</span>
                <a href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.75rem' }}>Maps</a>
              </div>
            ))}
            {withCoords.length > 15 && <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>... e mais {withCoords.length - 15}</p>}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

