import PropertiesCatalog from '@/components/public/PropertiesCatalog'
import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { serializeProperty } from '@/utils/serializers'

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
  
  const serializedProperties = properties.map(serializeProperty)

  return <PropertiesCatalog mode="LANCAMENTO" initialProperties={serializedProperties} />
}
