import PropertiesCatalog from '@/components/public/PropertiesCatalog'
import { Metadata } from 'next'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Lançamentos Imobiliários | Golden Garopaba',
  description: 'Portfólio exclusivo de lançamentos de mansões, coberturas e casas de alto padrão em Garopaba e região.',
}

export default async function LancamentosPage() {
  const properties = await prisma.property.findMany({
    where: { transactionType: 'LANCAMENTO' },
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

  return <PropertiesCatalog mode="LANCAMENTO" initialProperties={serializedProperties} />
}
