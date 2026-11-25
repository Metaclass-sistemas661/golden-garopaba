'use server'

import prisma from '@/lib/prisma'
import { revalidatePath, unstable_cache, updateTag } from 'next/cache'
import { requireAdminAuth } from '@/lib/auth'

const fetchCachedSettings = unstable_cache(
  async () => {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'singleton' }
    })

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'singleton' }
      })
    }

    return settings
  },
  ['system-settings-singleton'],
  { revalidate: 300, tags: ['system-settings'] }
)

export async function getSettings() {
  try {
    return await fetchCachedSettings()
  } catch (error) {
    console.error('Error fetching settings:', error)
    return null
  }
}

export async function updateSettings(data: Partial<import('@prisma/client').SystemSettings> & Record<string, unknown>) {
  try {
    await requireAdminAuth()

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

    updateTag('system-settings')
    revalidatePath('/painel/configuracoes')
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error updating settings:', err)
    return { success: false, error: err.message || 'Erro ao salvar configurações.' }
  }
}
