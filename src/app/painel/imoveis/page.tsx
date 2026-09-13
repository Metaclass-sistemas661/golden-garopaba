import prisma from '@/lib/prisma'
import ClientPage from './ClientPage'

export const dynamic = 'force-dynamic' // Garante que a página sempre pegue os dados mais novos

export default async function ImoveisPage() {
  // Puxa todos os imóveis do banco de dados real
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: 'desc' }
  })

  // Converte tipos complexos (Decimal, Date) para evitar erros no componente Client
  const serializedProperties = properties.map(p => ({
    ...p,
    price: p.price ? parseFloat(p.price.toString()) : 0,
    rentPrice: p.rentPrice ? parseFloat(p.rentPrice.toString()) : null,
    condoPrice: p.condoPrice ? parseFloat(p.condoPrice.toString()) : null,
    iptuPrice: p.iptuPrice ? parseFloat(p.iptuPrice.toString()) : null,
    areaTotal: p.areaTotal ? parseFloat(p.areaTotal.toString()) : null,
    areaUseful: p.areaUseful ? parseFloat(p.areaUseful.toString()) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  const brokers = await prisma.broker.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, displayName: true, commissionPercentageSale: true, commissionPercentageRent: true }
  })
  
  const serializedBrokers = brokers.map(b => ({
    ...b,
    commissionPercentageSale: Number(b.commissionPercentageSale),
    commissionPercentageRent: Number(b.commissionPercentageRent)
  }))

  return <ClientPage initialProperties={serializedProperties} brokers={serializedBrokers} />
}
