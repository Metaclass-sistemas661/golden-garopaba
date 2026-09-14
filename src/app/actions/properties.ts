'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null
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
