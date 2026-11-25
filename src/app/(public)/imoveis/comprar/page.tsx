import PropertiesCatalog from '@/components/public/PropertiesCatalog'
import { Metadata } from 'next'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import { PROPERTY_CARD_SELECT, serializePropertyCard } from '@/utils/serializers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Comprar Imóveis de Luxo | Golden Garopaba',
  description: 'Portfólio exclusivo de mansões, coberturas e casas de alto padrão à venda em Garopaba e região.',
}

export default async function ComprarPage() {
  const properties = await prisma.property.findMany({
    where: { transactionType: 'SALE' },
    select: PROPERTY_CARD_SELECT,
    orderBy: { createdAt: 'desc' }
  })

  const serializedProperties = properties.map(serializePropertyCard)

  return (
    <Suspense fallback={null}>
      <PropertiesCatalog mode="SALE" initialProperties={serializedProperties} />
    </Suspense>
  )
}
