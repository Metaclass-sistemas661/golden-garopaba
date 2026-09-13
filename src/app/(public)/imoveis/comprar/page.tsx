import PropertiesCatalog from '@/components/public/PropertiesCatalog'
import { Metadata } from 'next'
import prisma from '@/lib/prisma'

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

  return <PropertiesCatalog mode="SALE" initialProperties={serializedProperties} />
}
