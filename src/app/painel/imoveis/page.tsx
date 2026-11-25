import prisma from '@/lib/prisma'
import ClientPage from './ClientPage'
import { PROPERTY_CARD_SELECT, serializePropertyCard, serializeBroker } from '@/utils/serializers'

export const dynamic = 'force-dynamic'

export default async function ImoveisPage() {
  const [properties, brokers] = await Promise.all([
    prisma.property.findMany({
      select: PROPERTY_CARD_SELECT,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.broker.findMany({
      where: { status: 'ACTIVE' }
    })
  ])

  return (
    <ClientPage
      initialProperties={properties.map(serializePropertyCard)}
      brokers={brokers.map(serializeBroker)}
    />
  )
}
