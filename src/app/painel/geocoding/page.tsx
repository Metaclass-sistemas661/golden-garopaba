import { Metadata } from 'next'
import GeocodingClient from './GeocodingClient'

export const metadata: Metadata = {
  title: 'Geocodificação | Painel Admin',
}

export default function GeocodingPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Mapa & Geo (Geocodificação em Massa)</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Esta ferramenta varre todos os imóveis cadastrados que ainda não possuem coordenadas exatas (Latitude e Longitude) 
        e busca a localização correta usando a API do Google Maps.
      </p>
      <GeocodingClient />
    </div>
  )
}
