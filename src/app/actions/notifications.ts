'use server'

import prisma from '@/lib/prisma'

export interface NotificationItem {
  id: string;
  type: 'LEAD' | 'SALE' | 'RENT';
  title: string;
  description: string;
  timestamp: Date;
  isNew: boolean;
}

export async function getRecentNotifications(): Promise<NotificationItem[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  // 1. Buscar transações recentes
  const transactions = await prisma.propertyTransaction.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    include: {
      broker: { select: { displayName: true } },
      property: { select: { code: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // 2. Buscar leads recentes
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    include: {
      property: { select: { code: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const notifications: NotificationItem[] = [];

  transactions.forEach(t => {
    notifications.push({
      id: `txn-${t.id}`,
      type: t.transactionType === 'SALE' ? 'SALE' : 'RENT',
      title: t.transactionType === 'SALE' ? 'Nova Venda Registrada' : 'Novo Aluguel Registrado',
      description: `Corretor(a) ${t.broker.displayName} fechou negócio no imóvel Cód. ${t.property.code}.`,
      timestamp: t.createdAt,
      isNew: t.createdAt >= oneDayAgo
    });
  });

  leads.forEach(l => {
    notifications.push({
      id: `lead-${l.id}`,
      type: 'LEAD',
      title: 'Novo Lead Recebido',
      description: `${l.name} demonstrou interesse no imóvel Cód. ${l.property.code}.`,
      timestamp: l.createdAt,
      isNew: l.createdAt >= oneDayAgo
    });
  });

  // Ordenar por mais recente
  notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return notifications.slice(0, 15);
}
