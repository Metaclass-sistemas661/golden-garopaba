import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import HomeClient from './HomeClient'
import { PROPERTY_CARD_SELECT, serializePropertyCard } from '@/utils/serializers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Golden Garopaba | Imóveis de Luxo',
  description: 'A principal imobiliária de luxo em Garopaba. Encontre mansões exclusivas e coberturas espetaculares.',
}

export default async function Home() {
  const properties = await prisma.property.findMany({
    where: { featured: true },
    select: PROPERTY_CARD_SELECT,
    take: 3,
    orderBy: { createdAt: 'desc' }
  })

  const serializedProperties = properties.map(serializePropertyCard)

  return <HomeClient featuredProperties={serializedProperties} />
}
