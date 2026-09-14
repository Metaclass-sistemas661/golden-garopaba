import PropertiesCatalog from '@/components/public/PropertiesCatalog'
import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { serializeProperty } from '@/utils/serializers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Comprar Imóveis de Luxo | Golden Garopaba',
  description: 'Portfólio exclusivo de mansões, coberturas e casas de alto padrão à venda em Garopaba e região.',
}

export default async function ComprarPage() {
  const properties = await prisma.property.findMany({
    where: { transactionType: 'SALE' },
    orderBy: { createdAt: 'desc' }
  })
  
  const serializedProperties = properties.map(serializeProperty)

  return <PropertiesCatalog mode="SALE" initialProperties={serializedProperties} />
}
