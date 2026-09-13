import PropertiesCatalog from '@/components/public/PropertiesCatalog'
import { Metadata } from 'next'
import prisma from '@/lib/prisma'

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

  return <PropertiesCatalog mode="RENT" initialProperties={serializedProperties} />
}
