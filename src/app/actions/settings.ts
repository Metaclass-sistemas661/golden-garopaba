'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getSettings() {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'singleton' }
    })

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'singleton' }
      })
    }
    
    return settings
  } catch (error) {
    console.error('Error fetching settings:', error)
    return null
  }
}

export async function updateSettings(data: Partial<import('@prisma/client').SystemSettings> & Record<string, unknown>) {
  try {
    const payload = {
      companyName: data.companyName,
      companyLegalName: data.companyLegalName,
      cnpj: data.cnpj,
      creci: data.creci,
      email: data.email,
      colorPrimary: data.colorPrimary,
      colorSecondary: data.colorSecondary,
      typography: data.typography,
      whatsappNumber: data.whatsappNumber || null,
      googleAnalyticsId: data.googleAnalyticsId || null,
      metaPixelId: data.metaPixelId || null,
      twoFactorEnabled: data.twoFactorEnabled,
      logoUrl: data.logoUrl || null,
    }

    await prisma.systemSettings.upsert({
      where: { id: 'singleton' },
      update: payload,
      create: {
        id: 'singleton',
        ...payload
      }
    })

    revalidatePath('/painel/configuracoes')
    // Pode ser necessário revalidar rotas públicas também
    revalidatePath('/', 'layout')
    
    return { success: true }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating settings:', err)
    return { success: false, error: err.message || 'Erro ao salvar configurações.' }
  }
}
