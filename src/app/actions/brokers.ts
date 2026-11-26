'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdminAuth, UnauthorizedError } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const BROKER_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function extractAvatarStoragePath(avatarUrl: string | null): string | null {
  if (!avatarUrl) return null
  const marker = '/storage/v1/object/public/properties/'
  const idx = avatarUrl.indexOf(marker)
  if (idx === -1) return null
  const rawPath = avatarUrl.slice(idx + marker.length).split('?')[0]
  return rawPath ? decodeURIComponent(rawPath) : null
}

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
    await requireAdminAuth()

    const missing: string[] = []
    if (!data.fullName?.trim()) missing.push('Nome Completo')
    if (!data.displayName?.trim()) missing.push('Nome de Exibição')
    if (!data.creci?.trim()) missing.push('CRECI')
    if (!data.email?.trim()) missing.push('E-mail')
    if (!data.whatsapp?.trim()) missing.push('WhatsApp')
    if (!data.specialty?.trim()) missing.push('Especialidade')
    if (missing.length > 0) {
      return { success: false, error: `Preencha os campos obrigatórios: ${missing.join(', ')}.` }
    }

    const payload = {
      fullName: data.fullName.trim(),
      displayName: data.displayName.trim(),
      creci: data.creci.trim(),
      document: data.document?.trim() || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      email: data.email.trim(),
      whatsapp: data.whatsapp.trim(),
      phoneAlt: data.phoneAlt?.trim() || null,
      address: data.address?.trim() || null,
      specialty: data.specialty.trim(),
      commissionPercentageSale: Number(data.commissionPercentageSale || 0),
      commissionPercentageRent: Number(data.commissionPercentageRent || 0),
      salesGoalQuarterly: data.salesGoalQuarterly ? Number(data.salesGoalQuarterly) : null,
      status: (['ACTIVE', 'VACATION', 'INACTIVE'].includes(data.status) ? data.status : 'ACTIVE') as import('@prisma/client').BrokerStatus,
      hiredAt: data.hiredAt ? new Date(data.hiredAt) : null,
      instagramUrl: data.instagramUrl?.trim() || null,
      linkedinUrl: data.linkedinUrl?.trim() || null,
      youtubeUrl: data.youtubeUrl?.trim() || null,
      avatarUrl: data.avatarUrl?.trim() || null,
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
    revalidatePath('/painel')
    revalidatePath('/painel/imoveis')
    return { success: true }
  } catch (error: unknown) {
    const err = error as Error
    console.error('=== ERRO DETALHADO AO SALVAR CORRETOR ===')
    console.error('Mensagem:', err?.message)
    return { success: false, error: err?.message || 'Erro interno ao salvar no banco.' }
  }
}

export async function deleteBroker(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminAuth()

    if (!id || !BROKER_UUID_REGEX.test(id)) {
      return { success: false, error: 'ID de corretor inválido.' }
    }

    const deleted = await prisma.broker.delete({
      where: { id },
      select: { id: true, avatarUrl: true },
    })

    // Limpeza best-effort da foto de perfil no Supabase Storage (não bloqueia a exclusão do banco)
    const storagePath = extractAvatarStoragePath(deleted.avatarUrl)
    if (storagePath && storagePath.startsWith('avatars/')) {
      try {
        const supabase = await createClient()
        await supabase.storage.from('properties').remove([storagePath])
      } catch (storageErr) {
        console.warn('[deleteBroker] Falha ao remover avatar no Storage:', storageErr)
      }
    }

    revalidatePath('/painel/corretores')
    revalidatePath(`/painel/corretores/editar/${id}`)
    revalidatePath(`/painel/corretores/${id}/performance`)
    revalidatePath('/painel/imoveis')
    revalidatePath('/painel')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message }
    }
    const prismaCode = (error as { code?: string })?.code
    if (prismaCode === 'P2025') {
      return { success: false, error: 'Corretor não encontrado ou já foi excluído.' }
    }
    console.error('[deleteBroker] Erro ao excluir corretor:', error)
    return { success: false, error: 'Não foi possível excluir o corretor no banco de dados.' }
  }
}

export async function toggleBrokerStatus(id: string, currentStatus: string) {
  try {
    await requireAdminAuth()
    let nextStatus: 'ACTIVE' | 'VACATION' | 'INACTIVE' = 'VACATION'
    if (currentStatus === 'VACATION') nextStatus = 'INACTIVE'
    if (currentStatus === 'INACTIVE') nextStatus = 'ACTIVE'

    await prisma.broker.update({
      where: { id },
      data: { status: nextStatus }
    })
    revalidatePath('/painel/corretores')
    revalidatePath('/painel/imoveis')
    revalidatePath('/painel')
    return { success: true }
  } catch {
    return { success: false }
  }
}
