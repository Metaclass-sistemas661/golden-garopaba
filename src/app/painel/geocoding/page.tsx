'use client'

import { useState } from 'react'
import { MapPin, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { geocodeAllProperties, getGeocodingStats } from '@/app/actions/properties'

export default function GeocodingAdminPage() {
  const [stats, setStats] = useState<{total:number;withCoordinates:number;withoutCoordinates:number;percentageGeocoded:number}|null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{success:boolean;message?:string;geocoded:number;failed:number}|null>(null)

  const loadStats = async () => {
    setLoading(true)
    const response = await getGeocodingStats()
    if (response.success && response.stats) setStats(response.stats)
    setLoading(false)
  }

  const runGeocoding = async () => {
    if (processing) return
    setProcessing(true)
    setResult(null)
    const response = await geocodeAllProperties()
    setResult(response)
    await loadStats()
    setProcessing(false)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: '#f8fafc' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <MapPin size={32} color="#d4af37" />
        <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Geocodificação de Imóveis</h1>
      </div>

      <div style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '2rem' }}>
        <p style={{ margin: 0, color: '#d4af37' }}>⚠️ Esta ferramenta geocodifica automaticamente todos os imóveis sem coordenadas.</p>
      </div>

      <div style={{ background: '#1e293b', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Estatísticas</h2>
          <button onClick={loadStats} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#f8fafc', cursor: 'pointer' }}>
            <RefreshCw size={16} />
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>
        {stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Total</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.total}</div>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ color: '#4ade80', fontSize: '0.85rem' }}>Com Coords</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#22c55e' }}>{stats.withCoordinates}</div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ color: '#f87171', fontSize: '0.85rem' }}>Sem Coords</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef4444' }}>{stats.withoutCoordinates}</div>
            </div>
            <div style={{ background: 'rgba(212,175,55,0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ color: '#d4af37', fontSize: '0.85rem' }}>% Pronto</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#d4af37' }}>{stats.percentageGeocoded}%</div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#64748b', textAlign: 'center' }}>Clique em Atualizar para ver as estatísticas</p>
        )}
      </div>

      <button onClick={runGeocoding} disabled={processing || stats?.withoutCoordinates === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem', background: processing ? '#475569' : 'linear-gradient(135deg, #d4af37, #b8963a)', border: 'none', borderRadius: '10px', color: processing ? '#94a3b8' : '#0f172a', fontSize: '1rem', fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer', width: '100%', justifyContent: 'center' }}>
        {processing ? (<><Loader2 size={20} /> Geocodificando...</>) : (<><MapPin size={20} /> Geocodificar Todos ({stats?.withoutCoordinates || '?'})</>)}
      </button>

      {result && (
        <div style={{ marginTop: '1.5rem', background: result.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${result.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {result.success ? <CheckCircle size={24} color="#22c55e" /> : <XCircle size={24} color="#ef4444" />}
            <span style={{ color: result.success ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{result.message}</span>
          </div>
          <p style={{ margin: '1rem 0 0', color: '#f8fafc' }}>✅ Sucesso: {result.geocoded} | ❌ Falhas: {result.failed}</p>
        </div>
      )}
    </div>
  )
}
