'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ============================================================================
// Server-side geocoding helpers
// ============================================================================

function getGoogleMapsApiKey(): string | null {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) {
    console.error('❌ [GEOCODING] GOOGLE_MAPS_API_KEY não configurada.')
  }
  return key || null
}

async function geocodeSingle(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey || !address?.trim()) return null

  const normalized = address.replace(/\s+/g, ' ').replace(/\s*-\s*/g, ' - ').trim()
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(normalized)}&key=${apiKey}&region=br&language=pt-BR`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const data = await res.json()

    if (data.status === 'OK' && data.results?.length > 0) {
      const { lat, lng } = data.results[0].geometry.location
      if (lat >= -34.0 && lat <= 6.0 && lng >= -74.0 && lng <= -32.0) {
        return { lat, lng }
      }
    }

    if (data.status === 'ZERO_RESULTS') {
      const parts = normalized.split(' - ')
      if (parts.length >= 2) {
        const simplified = parts.slice(-2).join(' - ').trim()
        if (simplified !== normalized) return geocodeSingle(simplified)
      }
    }

    console.warn(`⚠️ [GEOCODING] Status: ${data.status} para: "${normalized}"`)
    return null
  } catch (err) {
    console.error(`❌ [GEOCODING] Erro para "${normalized}":`, err)
    return null
  }
}

function buildAddress(p: {
  street?: string | null
  number?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  location?: string | null
}): string {
  const parts: string[] = []
  if (p.street) {
    parts.push(p.street)
    if (p.number) parts.push(p.number)
  }
  if (p.neighborhood) parts.push(`- ${p.neighborhood}`)
  if (p.city && p.state) parts.push(`${p.city} - ${p.state}`)
  else if (p.city) parts.push(p.city)
  return parts.length > 0
    ? parts.join(', ').replace(', -', ' -')
    : (p.location || '')
}

// ============================================================================
// Bulk geocoding — geocodes all properties missing lat/lng
// ============================================================================

export interface BulkGeocodeDetail {
  id: string
  code: string
  title: string
  location: string
  status: 'geocoded' | 'failed' | 'skipped'
  coords?: { lat: number; lng: number }
  error?: string
}

export interface BulkGeocodeResult {
  success: boolean
  total: number
  geocoded: number
  failed: number
  skipped: number
  errors: string[]
  details: BulkGeocodeDetail[]
}

export async function bulkGeocodeProperties(): Promise<BulkGeocodeResult> {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) {
    return {
      success: false, total: 0, geocoded: 0, failed: 0, skipped: 0,
      errors: ['API Key do Google Maps não configurada. Configure GOOGLE_MAPS_API_KEY.'],
      details: [],
    }
  }

  const properties = await prisma.property.findMany({
    where: { OR: [{ latitude: null }, { longitude: null }] },
    select: { id: true, code: true, title: true, location: true, street: true, number: true, neighborhood: true, city: true, state: true },
  })

  const result: BulkGeocodeResult = {
    success: true, total: properties.length, geocoded: 0, failed: 0, skipped: 0, errors: [], details: [],
  }

  for (const property of properties) {
    const addressStr = buildAddress(property)

    if (!addressStr?.trim()) {
      result.skipped++
      result.details.push({ id: property.id, code: property.code, title: property.title, location: '', status: 'skipped', error: 'Sem endereço' })
      continue
    }

    await new Promise(r => setTimeout(r, 150)) // 150ms delay to avoid rate limits

    const coords = await geocodeSingle(addressStr)

    if (coords) {
      try {
        await prisma.property.update({ where: { id: property.id }, data: { latitude: coords.lat, longitude: coords.lng } })
        result.geocoded++
        result.details.push({ id: property.id, code: property.code, title: property.title, location: addressStr, status: 'geocoded', coords })
      } catch (dbErr) {
        result.failed++
        const msg = dbErr instanceof Error ? dbErr.message : String(dbErr)
        result.errors.push(`DB error ${property.code}: ${msg}`)
        result.details.push({ id: property.id, code: property.code, title: property.title, location: addressStr, status: 'failed', error: msg })
      }
    } else {
      result.failed++
      result.details.push({ id: property.id, code: property.code, title: property.title, location: addressStr, status: 'failed', error: 'Geocoding sem resultado' })
    }
  }

  revalidatePath('/')
  revalidatePath('/imoveis/comprar')
  revalidatePath('/imoveis/alugar')
  revalidatePath('/lancamentos')
  return result
}

// ============================================================================
// Single property geocode (retry individual)
// ============================================================================

export async function geocodePropertyById(id: string): Promise<{
  success: boolean
  coords?: { lat: number; lng: number }
  error?: string
}> {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) return { success: false, error: 'API Key não configurada.' }

  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, location: true, street: true, number: true, neighborhood: true, city: true, state: true },
  })

  if (!property) return { success: false, error: 'Imóvel não encontrado.' }

  const addressStr = buildAddress(property)
  if (!addressStr?.trim()) return { success: false, error: 'Sem endereço disponível.' }

  const coords = await geocodeSingle(addressStr)
  if (!coords) return { success: false, error: `Nenhum resultado para: "${addressStr}"` }

  await prisma.property.update({ where: { id }, data: { latitude: coords.lat, longitude: coords.lng } })

  revalidatePath('/')
  revalidatePath('/imoveis/comprar')
  revalidatePath('/imoveis/alugar')
  revalidatePath('/lancamentos')

  return { success: true, coords }
}
