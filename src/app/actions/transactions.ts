'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function registerTransaction(data: {
  propertyId: string,
  brokerId: string,
  transactionType: 'SALE' | 'RENT',
  amount: number,
  transactionDate: string
}) {
  try {
    // Busca o corretor para pegar a porcentagem de comissão
    const broker = await prisma.broker.findUnique({
      where: { id: data.brokerId }
    })

    if (!broker) {
      return { success: false, error: 'Corretor não encontrado' }
    }

    // Calcula a comissão
    const commissionPercentage = data.transactionType === 'SALE' 
      ? Number(broker.commissionPercentageSale) 
      : Number(broker.commissionPercentageRent)
      
    const commissionAmount = data.amount * (commissionPercentage / 100)

    // Cria a transação
    await prisma.propertyTransaction.create({
      data: {
        propertyId: data.propertyId,
        brokerId: data.brokerId,
        transactionType: data.transactionType,
        amount: data.amount,
        commissionAmount: commissionAmount,
        transactionDate: new Date(data.transactionDate)
      }
    })

    // Atualiza o status do imóvel para SOLD ou RENTED
    await prisma.property.update({
      where: { id: data.propertyId },
      data: { status: data.transactionType === 'SALE' ? 'SOLD' : 'RENTED' }
    })

    revalidatePath('/painel/imoveis')
    revalidatePath(`/painel/corretores/${data.brokerId}/performance`)
    revalidatePath('/painel')
    
    return { success: true }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Erro ao registrar transação:', err)
    return { success: false, error: err?.message || 'Erro interno.' }
  }
}
