import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import HomeClient from './HomeClient'
import { serializeProperty } from '@/utils/serializers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Golden Garopaba | Imóveis de Luxo',
  description: 'A principal imobiliária de luxo em Garopaba. Encontre mansões exclusivas e coberturas espetaculares.',
}

export default async function Home() {
  // Buscar os 3 imóveis mais recentes (ou "Destaques")
  const properties = await prisma.property.findMany({
    where: { featured: true },
    take: 3,
    orderBy: { createdAt: 'desc' }
  })
  
  const serializedProperties = properties.map(serializeProperty)

  return <HomeClient featuredProperties={serializedProperties} />
}
