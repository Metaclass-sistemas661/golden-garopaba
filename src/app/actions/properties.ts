'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Geocoding function using Google Maps API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey || !address) return null

  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=br`
    )
    const data = await response.json()
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return { lat: location.lat, lng: location.lng }
    }
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
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
    // Auto-geocoding: Se não tiver coordenadas, busca automaticamente pelo endereço
    let latitude = data.latitude ? Number(data.latitude) : null
    let longitude = data.longitude ? Number(data.longitude) : null
    
    if ((!latitude || !longitude) && data.location) {
      console.log('🗺️ Geocoding address:', data.location)
      const coords = await geocodeAddress(data.location)
      if (coords) {
        latitude = coords.lat
        longitude = coords.lng
        console.log('✅ Geocoding success:', coords)
      } else {
        console.log('⚠️ Geocoding failed for:', data.location)
      }
    }

    const payload = {
      title: data.title,
      code: data.code,
      transactionType: data.transactionType as import('@prisma/client').TransactionType,
      category: data.category as import('@prisma/client').PropertyCategory,
      propertyType: data.propertyType,
      location: data.location,
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
