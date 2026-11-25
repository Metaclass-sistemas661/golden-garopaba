import PropertiesCatalog from '@/components/public/PropertiesCatalog'
import { Metadata } from 'next'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import { PROPERTY_CARD_SELECT, serializePropertyCard } from '@/utils/serializers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Alugar Imóveis de Luxo | Golden Garopaba',
  description: 'As melhores propriedades para aluguel de temporada e anual em Garopaba e região.',
}

export default async function AlugarPage() {
  const properties = await prisma.property.findMany({
    where: { transactionType: 'RENT' },
    select: PROPERTY_CARD_SELECT,
    orderBy: { createdAt: 'desc' }
  })

  const serializedProperties = properties.map(serializePropertyCard)

  return (
    <Suspense fallback={null}>
      <PropertiesCatalog mode="RENT" initialProperties={serializedProperties} />
    </Suspense>
  )
}
