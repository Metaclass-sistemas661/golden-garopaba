'use client'

import { useState } from 'react'
import { bulkGeocodeProperties } from '@/app/actions/geocoding'

export default function GeocodingClient() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleBulkGeocode = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await bulkGeocodeProperties()
      setResult(res)
    } catch (err: any) {
      setResult({ success: false, errors: [err.message] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button 
        onClick={handleBulkGeocode} 
        disabled={loading}
        style={{
          background: '#0f172a', color: 'white', border: 'none', padding: '0.75rem 1.5rem', 
          borderRadius: '0.5rem', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600
        }}
      >
        {loading ? 'Processando... Aguarde' : 'Processar Todos os Imóveis Sem Mapa'}
      </button>

      {result && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: '#f8fafc' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: result.success ? '#15803d' : '#b91c1c' }}>
            {result.success ? '✅ Processamento Concluído' : '❌ Falha no Processamento'}
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <strong>Total Verificados</strong><br/>{result.total || 0}
            </div>
            <div style={{ background: '#dcfce7', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #86efac' }}>
              <strong>Corrigidos (OK)</strong><br/>{result.geocoded || 0}
            </div>
            <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fca5a5' }}>
              <strong>Falhas</strong><br/>{result.failed || 0}
            </div>
            <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
              <strong>Ignorados (Sem Endereço)</strong><br/>{result.skipped || 0}
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div style={{ color: '#b91c1c', marginTop: '1rem' }}>
              <h3>Erros Registrados:</h3>
              <ul style={{ paddingLeft: '1.5rem' }}>
                {result.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
