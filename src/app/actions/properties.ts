'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { validateAndSanitizeAddress } from '@/utils/addressValidation'

// ============================================================================
// Enterprise-Grade Geocoding with retry, validation and detailed logging
// ============================================================================
function getGoogleMapsApiKey(): string | null {
  // Server-side: prefer dedicated server key, fallback to public key
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) {
    console.error('❌ [GEOCODING] Nenhuma API Key do Google Maps configurada!')
    console.error('   Configure GOOGLE_MAPS_API_KEY ou NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no .env')
  }
  return key || null
}

function normalizeAddress(address: string): string {
  // Remove caracteres extras e normaliza o endereço para melhor resultado de geocoding
  return address
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .trim()
}

function validateCoordinates(lat: number, lng: number): boolean {
  // Validação enterprise: Coordenadas devem estar dentro do Brasil (-34 a 5 lat, -74 a -32 lng)
  const isValidLat = lat >= -34.0 && lat <= 6.0
  const isValidLng = lng >= -74.0 && lng <= -32.0
  if (!isValidLat || !isValidLng) {
    console.warn(`⚠️ [GEOCODING] Coordenadas fora do Brasil: lat=${lat}, lng=${lng}`)
  }
  return isValidLat && isValidLng
}

async function geocodeAddress(address: string, retries = 2): Promise<{ lat: number; lng: number } | null> {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey || !address) return null

  const normalizedAddress = normalizeAddress(address)
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const encodedAddress = encodeURIComponent(normalizedAddress)
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=br&language=pt-BR`
      
      console.log(`🗺️ [GEOCODING] Tentativa ${attempt + 1}/${retries + 1} para: "${normalizedAddress}"`)
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000), // 10s timeout
      })
      
      if (!response.ok) {
        console.error(`❌ [GEOCODING] HTTP ${response.status}: ${response.statusText}`)
        if (attempt < retries) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue }
        return null
      }

      const data = await response.json()
      
      // Detailed logging for debugging
      console.log(`📍 [GEOCODING] Status da API: ${data.status}`)
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        const formattedAddress = data.results[0].formatted_address
        
        if (validateCoordinates(location.lat, location.lng)) {
          console.log(`✅ [GEOCODING] Sucesso: ${formattedAddress} → (${location.lat}, ${location.lng})`)
          return { lat: location.lat, lng: location.lng }
        } else {
          console.warn(`⚠️ [GEOCODING] Coordenadas inválidas para Brasil, ignorando resultado`)
          return null
        }
      }
      
      // Handle specific API error statuses
      if (data.status === 'ZERO_RESULTS') {
        console.warn(`⚠️ [GEOCODING] Nenhum resultado para: "${normalizedAddress}"`)
        // Try with a simplified address (just city + state) as fallback
        if (attempt === 0 && normalizedAddress.includes('-')) {
          const parts = normalizedAddress.split('-')
          if (parts.length >= 2) {
            const simplified = parts.slice(-2).join(' - ').trim()
            console.log(`🔄 [GEOCODING] Tentando endereço simplificado: "${simplified}"`)
            const fallback = await geocodeAddress(simplified, 0) // No recursion beyond this
            if (fallback) return fallback
          }
        }
        return null
      }
      
      if (data.status === 'OVER_QUERY_LIMIT') {
        console.error('❌ [GEOCODING] Limite de requisições da API excedido')
        if (attempt < retries) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
        return null
      }
      
      if (data.status === 'REQUEST_DENIED') {
        console.error('❌ [GEOCODING] Requisição negada. Verifique:')
        console.error('   1. A API Key está válida')
        console.error('   2. A Geocoding API está habilitada no Google Cloud Console')
        console.error('   3. Não há restrições de IP/referrer bloqueando')
        console.error(`   Detalhes: ${data.error_message || 'N/A'}`)
        return null
      }
      
      console.error(`❌ [GEOCODING] Status inesperado: ${data.status}`, data.error_message || '')
      return null
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`❌ [GEOCODING] Erro na tentativa ${attempt + 1}: ${errorMsg}`)
      if (attempt < retries) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue }
      return null
    }
  }
  
  return null
}

// Note: O upload das fotos será feito no lado do Cliente (Supabase JS) 
// antes de chamar essa função, passando as URLs já prontas aqui.
export interface PropertyPayload {
  title: string;
  code: string;
  transactionType: string;
  category: string;
  propertyType: string;
  location: string;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  description: string;
  price?: number | null;
  rentPrice?: number | null;
  condoPrice?: number | null;
  iptuPrice?: number | null;
  areaTotal?: number | null;
  areaUseful?: number | null;
  bedrooms?: number | null;
  suites?: number | null;
  bathrooms?: number | null;
  parkingSpaces?: number | null;
  features?: string[];
  leisure?: string[];
  security?: string[];
  furniture?: string[];
  environments?: string[];
  infrastructure?: string[];
  photos?: string[];
  tourLink?: string | null;
  videoLink?: string | null;
  financeable?: boolean;
  featured?: boolean;
  status?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export async function saveProperty(data: PropertyPayload, isEdit: boolean, id?: string) {
  try {
    // ========================================================================
    // Enterprise Geocoding: Auto-resolve coordinates from address
    // ========================================================================
    let latitude = data.latitude ? Number(data.latitude) : null
    let longitude = data.longitude ? Number(data.longitude) : null
    
    // Se estiver editando e o endereço mudou, forçar novo geocoding
    if (isEdit && id && data.location) {
      try {
        const existing = await prisma.property.findUnique({
          where: { id },
          select: { location: true, latitude: true, longitude: true }
        })
        if (existing && existing.location !== data.location) {
          console.log('📝 [SAVE] Endereço alterado, forçando novo geocoding')
          console.log(`   Anterior: "${existing.location}"`)
          console.log(`   Novo: "${data.location}"`)
          latitude = null
          longitude = null
        } else if (existing?.latitude && existing?.longitude && !latitude && !longitude) {
          // Manter coordenadas existentes se endereço não mudou
          latitude = existing.latitude
          longitude = existing.longitude
          console.log(`📍 [SAVE] Mantendo coordenadas existentes: (${latitude}, ${longitude})`)
        }
      } catch (lookupErr) {
        console.warn('⚠️ [SAVE] Erro ao buscar imóvel existente para comparação:', lookupErr)
      }
    }
    
    // Geocoding automático quando necessário
    if ((!latitude || !longitude) && data.location) {
      console.log('🗺️ [SAVE] Iniciando geocoding para:', data.location)
      const coords = await geocodeAddress(data.location)
      if (coords) {
        latitude = coords.lat
        longitude = coords.lng
        console.log(`✅ [SAVE] Geocoding OK: (${coords.lat}, ${coords.lng})`)
      } else {
        console.warn(`⚠️ [SAVE] Geocoding falhou para: "${data.location}"`)
        console.warn('   O imóvel será salvo SEM coordenadas. Use /painel/geocoding para corrigir.')
      }
    }

    // ========================================================================
    // Enterprise Address Validation & Sanitization (Server-Side)
    // ========================================================================
    const addressResult = validateAndSanitizeAddress({
      street:       data.street,
      number:       data.number,
      complement:   data.complement,
      neighborhood: data.neighborhood,
      city:         data.city,
      state:        data.state,
      zipCode:      data.zipCode,
    })

    if (!addressResult.valid) {
      console.warn('⚠️ [SAVE] Endereço com campos inválidos:', addressResult.errors)
      return {
        success: false,
        error: `Endereço inválido: ${addressResult.errors.join(' | ')}`
      }
    }

    const addr = addressResult.sanitized

    const payload = {
      title: data.title,
      code: data.code,
      transactionType: data.transactionType as import('@prisma/client').TransactionType,
      category: data.category as import('@prisma/client').PropertyCategory,
      propertyType: data.propertyType,
      location: data.location,
      // Use sanitized & validated address values from server-side validation
      street:       addr.street,
      number:       addr.number,
      complement:   addr.complement,
      neighborhood: addr.neighborhood,
      city:         addr.city,
      state:        addr.state,
      zipCode:      addr.zipCode,
      description: data.description,
      price: data.price ? Number(data.price) : 0,
      rentPrice: data.rentPrice ? Number(data.rentPrice) : null,
      condoPrice: data.condoPrice ? Number(data.condoPrice) : null,
      iptuPrice: data.iptuPrice ? Number(data.iptuPrice) : null,
      areaTotal: data.areaTotal ? Number(data.areaTotal) : null,
      areaUseful: data.areaUseful ? Number(data.areaUseful) : null,
      bedrooms: data.bedrooms ? Number(data.bedrooms) : 0,
      suites: data.suites ? Number(data.suites) : 0,
      bathrooms: data.bathrooms ? Number(data.bathrooms) : 0,
      parkingSpaces: data.parkingSpaces ? Number(data.parkingSpaces) : 0,
      features: data.features || [],
      leisure: data.leisure || [],
      security: data.security || [],
      furniture: data.furniture || [],
      environments: data.environments || [],
      infrastructure: data.infrastructure || [],
      photos: data.photos || [],
      tourLink: data.tourLink || null,
      videoLink: data.videoLink || null,
      financeable: data.financeable || false,
      featured: data.featured || false,
      status: (data.status || 'AVAILABLE') as import('@prisma/client').PropertyStatus,
      latitude,
      longitude
    }

    if (isEdit && id) {
      await prisma.property.update({
        where: { id },
        data: payload
      })
    } else {
      await prisma.property.create({
        data: payload
      })
    }
    
    revalidatePath('/painel/imoveis')
    revalidatePath('/')
    revalidatePath('/imoveis/comprar')
    revalidatePath('/imoveis/alugar')
    revalidatePath('/lancamentos')
    return { success: true }
  } catch (error: unknown) {
    const err = error as Record<string, unknown> | Error;
    console.error('=== ERRO DETALHADO AO SALVAR IMOVEL ===')
    console.error('Mensagem:', (err as Error)?.message)
    console.error('Meta:', JSON.stringify((err as Record<string, unknown>)?.meta, null, 2))
    console.error('Erro completo:', err)
    const errorMessage = (err as Error)?.message || 'Erro desconhecido'
    return { success: false, error: errorMessage }
  }
}

export async function deleteProperty(id: string) {
  try {
    await prisma.property.delete({ where: { id } })
    revalidatePath('/painel/imoveis')
    revalidatePath('/')
    revalidatePath('/imoveis/comprar')
    revalidatePath('/imoveis/alugar')
    revalidatePath('/lancamentos')
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function togglePropertyStatus(id: string, currentStatus: string) {
  try {
    await prisma.property.update({
      where: { id },
      data: { status: currentStatus === 'AVAILABLE' ? 'SOLD' : 'AVAILABLE' }
    })
    revalidatePath('/painel/imoveis')
    revalidatePath('/')
    revalidatePath('/imoveis/comprar')
    revalidatePath('/imoveis/alugar')
    revalidatePath('/lancamentos')
    return { success: true }
  } catch {
    return { success: false }
  }
}

// ============================================
// GEOCODING UTILITIES
// ============================================

/**
 * Geocodifica uma propriedade individual
 * Útil para re-geocodificar propriedades com endereço atualizado
 */
export async function geocodeSingleProperty(propertyId: string) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, location: true, latitude: true, longitude: true }
    })

    if (!property) {
      return { success: false, error: 'Propriedade não encontrada' }
    }

    if (!property.location) {
      return { success: false, error: 'Propriedade sem endereço cadastrado' }
    }

    const coords = await geocodeAddress(property.location)
    if (!coords) {
      return { success: false, error: 'Não foi possível geocodificar o endereço' }
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: { latitude: coords.lat, longitude: coords.lng }
    })

    revalidatePath('/painel/imoveis')
    revalidatePath('/')
    revalidatePath('/imoveis/comprar')
    revalidatePath('/imoveis/alugar')
    revalidatePath('/lancamentos')

    return { success: true, coords }
  } catch (error) {
    console.error('Geocoding single property error:', error)
    return { success: false, error: 'Erro ao geocodificar propriedade' }
  }
}

/**
 * Geocodifica todas as propriedades sem coordenadas
 * ATENÇÃO: Esta função faz várias chamadas à API do Google Maps
 * Use com moderação para não exceder os limites da API
 */
export async function geocodeAllProperties() {
  try {
    // Busca propriedades sem coordenadas
    const propertiesWithoutCoords = await prisma.property.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ],
        location: { not: null }
      },
      select: { id: true, code: true, location: true }
    })

    console.log(`🗺️ Found ${propertiesWithoutCoords.length} properties without coordinates`)

    if (propertiesWithoutCoords.length === 0) {
      return { 
        success: true, 
        message: 'Todas as propriedades já possuem coordenadas',
        processed: 0,
        geocoded: 0,
        failed: 0
      }
    }

    let geocoded = 0
    let failed = 0
    const results: Array<{ code: string; success: boolean; error?: string }> = []

    for (const property of propertiesWithoutCoords) {
      if (!property.location) {
        results.push({ code: property.code, success: false, error: 'Sem endereço' })
        failed++
        continue
      }

      // Delay para evitar rate limiting da API (10 por segundo é o limite gratuito)
      await new Promise(resolve => setTimeout(resolve, 150))

      try {
        const coords = await geocodeAddress(property.location)
        
        if (coords) {
          await prisma.property.update({
            where: { id: property.id },
            data: { latitude: coords.lat, longitude: coords.lng }
          })
          results.push({ code: property.code, success: true })
          geocoded++
          console.log(`✅ Geocoded ${property.code}: ${coords.lat}, ${coords.lng}`)
        } else {
          results.push({ code: property.code, success: false, error: 'Geocoding falhou' })
          failed++
          console.log(`❌ Failed to geocode ${property.code}`)
        }
      } catch (error) {
        results.push({ code: property.code, success: false, error: String(error) })
        failed++
        console.error(`❌ Error geocoding ${property.code}:`, error)
      }
    }

    // Revalida todas as páginas relevantes
    revalidatePath('/painel/imoveis')
    revalidatePath('/')
    revalidatePath('/imoveis/comprar')
    revalidatePath('/imoveis/alugar')
    revalidatePath('/lancamentos')

    return {
      success: true,
      message: `Geocodificação concluída: ${geocoded} sucesso, ${failed} falhas`,
      processed: propertiesWithoutCoords.length,
      geocoded,
      failed,
      details: results
    }
  } catch (error) {
    console.error('Geocode all properties error:', error)
    return { 
      success: false, 
      error: 'Erro ao processar geocodificação em massa',
      processed: 0,
      geocoded: 0,
      failed: 0
    }
  }
}

/**
 * Retorna estatísticas de geocodificação
 */
export async function getGeocodingStats() {
  try {
    const totalProperties = await prisma.property.count()
    const withCoords = await prisma.property.count({
      where: {
        latitude: { not: null },
        longitude: { not: null }
      }
    })
    const withoutCoords = await prisma.property.count({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      }
    })
    const withoutLocation = await prisma.property.count({
      where: { location: null }
    })

    return {
      success: true,
      stats: {
        total: totalProperties,
        withCoordinates: withCoords,
        withoutCoordinates: withoutCoords,
        withoutLocation,
        percentageGeocoded: totalProperties > 0 
          ? Math.round((withCoords / totalProperties) * 100) 
          : 0
      }
    }
  } catch (error) {
    console.error('Get geocoding stats error:', error)
    return { success: false, error: 'Erro ao buscar estatísticas' }
  }
}
