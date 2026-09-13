'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Note: O upload das fotos será feito no lado do Cliente (Supabase JS) 
// antes de chamar essa função, passando as URLs já prontas aqui.
export async function saveProperty(data: any, isEdit: boolean, id?: string) {
  try {
    const payload = {
      title: data.title,
      code: data.code,
      transactionType: data.transactionType,
      category: data.category,
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
      status: data.status || 'AVAILABLE'
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
  } catch (error: any) {
    console.error('=== ERRO DETALHADO AO SALVAR IMOVEL ===')
    console.error('Mensagem:', error?.message)
    console.error('Codigo:', error?.code)
    console.error('Meta:', JSON.stringify(error?.meta, null, 2))
    console.error('Erro completo:', error)
    const errorMessage = error?.message || 'Erro desconhecido'
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
  } catch (error) {
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
  } catch (error) {
    return { success: false }
  }
}
