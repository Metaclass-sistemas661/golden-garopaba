'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface BrokerPayload {
  fullName: string;
  displayName: string;
  creci: string;
  document?: string | null;
  birthDate?: string | null;
  email: string;
  whatsapp: string;
  phoneAlt?: string | null;
  address?: string | null;
  specialty: string;
  commissionPercentageSale?: number | null;
  commissionPercentageRent?: number | null;
  salesGoalQuarterly?: number | null;
  status: string;
  hiredAt?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  avatarUrl?: string | null;
}

export async function saveBroker(data: BrokerPayload, isEdit: boolean, id?: string) {
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
      status: (data.status || 'ACTIVE') as import('@prisma/client').BrokerStatus,
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
  } catch (error: unknown) {
    const err = error as Error;
    console.error('=== ERRO DETALHADO AO SALVAR CORRETOR ===')
    console.error('Mensagem:', err?.message)
    console.error('Erro completo:', err)
    return { success: false, error: err?.message || 'Erro interno ao salvar no banco.' }
  }
}

export async function deleteBroker(id: string) {
  try {
    await prisma.broker.delete({ where: { id } })
    revalidatePath('/painel/corretores')
    return { success: true }
  } catch {
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
  } catch {
    return { success: false }
  }
}
