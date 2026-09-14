import PropertiesCatalog from '@/components/public/PropertiesCatalog'
import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { serializeProperty } from '@/utils/serializers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Alugar Imóveis de Luxo | Golden Garopaba',
  description: 'As melhores propriedades para aluguel de temporada e anual em Garopaba e região.',
}

export default async function AlugarPage() {
  const properties = await prisma.property.findMany({
    where: { transactionType: 'RENT' },
    orderBy: { createdAt: 'desc' }
  })
  
  const serializedProperties = properties.map(serializeProperty)

  return <PropertiesCatalog mode="RENT" initialProperties={serializedProperties} />
}
