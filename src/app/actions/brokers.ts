'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function saveBroker(data: any, isEdit: boolean, id?: string) {
  try {
    const payload = {
      fullName: data.fullName,
      displayName: data.displayName,
      creci: data.creci,
      document: data.document || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      email: data.email,
      whatsapp: data.whatsapp,
      phoneAlt: data.phoneAlt || null,
      address: data.address || null,
      specialty: data.specialty,
      commissionPercentageSale: Number(data.commissionPercentageSale || 0),
      commissionPercentageRent: Number(data.commissionPercentageRent || 0),
      salesGoalQuarterly: data.salesGoalQuarterly ? Number(data.salesGoalQuarterly) : null,
      status: data.status || 'ACTIVE',
      hiredAt: data.hiredAt ? new Date(data.hiredAt) : null,
      instagramUrl: data.instagramUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      youtubeUrl: data.youtubeUrl || null,
      avatarUrl: data.avatarUrl || null,
    }

    if (isEdit && id) {
      await prisma.broker.update({
        where: { id },
        data: payload
      })
    } else {
      await prisma.broker.create({
        data: payload
      })
    }
    
    revalidatePath('/painel/corretores')
    return { success: true }
  } catch (error: any) {
    console.error('=== ERRO DETALHADO AO SALVAR CORRETOR ===')
    console.error('Mensagem:', error?.message)
    console.error('Codigo:', error?.code)
    console.error('Erro completo:', error)
    return { success: false, error: error?.message || 'Erro interno ao salvar no banco.' }
  }
}

export async function deleteBroker(id: string) {
  try {
    await prisma.broker.delete({ where: { id } })
    revalidatePath('/painel/corretores')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function toggleBrokerStatus(id: string, currentStatus: string) {
  try {
    // Basic cycle: ACTIVE -> VACATION -> INACTIVE -> ACTIVE
    let nextStatus: 'ACTIVE' | 'VACATION' | 'INACTIVE' = 'VACATION'
    if (currentStatus === 'VACATION') nextStatus = 'INACTIVE'
    if (currentStatus === 'INACTIVE') nextStatus = 'ACTIVE'

    await prisma.broker.update({
      where: { id },
      data: { status: nextStatus }
    })
    revalidatePath('/painel/corretores')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}
