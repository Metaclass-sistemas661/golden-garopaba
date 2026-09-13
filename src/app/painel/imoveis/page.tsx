import prisma from '@/lib/prisma'
import ClientPage from './ClientPage'
import { serializeProperty, serializeBroker } from '@/utils/serializers'

export const dynamic = 'force-dynamic' // Garante que a página sempre pegue os dados mais novos

export default async function ImoveisPage() {
  // Puxa todos os imóveis do banco de dados real
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const serializedProperties = properties.map(serializeProperty)

  const brokers = await prisma.broker.findMany({
    where: { status: 'ACTIVE' }
  })
  
  const serializedBrokers = brokers.map(serializeBroker)

  return <ClientPage initialProperties={serializedProperties} brokers={serializedBrokers} />
}
