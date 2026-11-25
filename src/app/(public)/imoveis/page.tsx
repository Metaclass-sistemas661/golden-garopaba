import PropertiesCatalog from '@/components/public/PropertiesCatalog'
import { Metadata } from 'next'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import { PROPERTY_CARD_SELECT, serializePropertyCard } from '@/utils/serializers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Todos os Imóveis | Golden Garopaba',
  description: 'Explore todo o portfólio de imóveis à venda, locação e lançamentos em Garopaba e região.',
}

export default async function ImoveisPage() {
  const properties = await prisma.property.findMany({
    select: PROPERTY_CARD_SELECT,
    orderBy: { createdAt: 'desc' }
  })

  const serializedProperties = properties.map(serializePropertyCard)

  return (
    <Suspense fallback={null}>
      <PropertiesCatalog mode="ALL" initialProperties={serializedProperties} />
    </Suspense>
  )
}
