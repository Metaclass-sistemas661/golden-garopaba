'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { invalidatePublicPropertyCache } from '@/lib/cacheTags'
import { requireAdminAuth } from '@/lib/auth'

export async function registerTransaction(data: {
  propertyId: string,
  brokerId: string,
  transactionType: 'SALE' | 'RENT',
  amount: number,
  transactionDate: string
}) {
  try {
    await requireAdminAuth()

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      return { success: false, error: 'Informe um valor de fechamento válido maior que zero.' }
    }

    const parsedDate = new Date(data.transactionDate)
    if (Number.isNaN(parsedDate.getTime())) {
      return { success: false, error: 'Data de transação inválida.' }
    }

    const [broker, property] = await Promise.all([
      prisma.broker.findUnique({ where: { id: data.brokerId } }),
      prisma.property.findUnique({ where: { id: data.propertyId }, select: { id: true } }),
    ])

    if (!broker) {
      return { success: false, error: 'Corretor não encontrado' }
    }
    if (!property) {
      return { success: false, error: 'Imóvel não encontrado' }
    }

    const commissionPercentage = data.transactionType === 'SALE'
      ? Number(broker.commissionPercentageSale)
      : Number(broker.commissionPercentageRent)

    const commissionAmount = data.amount * (commissionPercentage / 100)

    await prisma.$transaction([
      prisma.propertyTransaction.create({
        data: {
          propertyId: data.propertyId,
          brokerId: data.brokerId,
          transactionType: data.transactionType,
          amount: data.amount,
          commissionAmount,
          transactionDate: parsedDate,
        }
      }),
      prisma.property.update({
        where: { id: data.propertyId },
        data: { status: data.transactionType === 'SALE' ? 'SOLD' : 'RENTED' }
      })
    ])

    revalidatePath('/painel/imoveis')
    revalidatePath(`/painel/corretores/${data.brokerId}/performance`)
    revalidatePath('/painel')
    revalidatePath('/')
    invalidatePublicPropertyCache()
    revalidatePath('/imoveis')
    revalidatePath('/imoveis/comprar')
    revalidatePath('/imoveis/alugar')
    revalidatePath('/lancamentos')
    revalidatePath(`/imoveis/${data.propertyId}`)

    return { success: true }
  } catch (error: unknown) {
    const err = error as Error
    console.error('Erro ao registrar transação:', err)
    return { success: false, error: err?.message || 'Erro interno.' }
  }
}
