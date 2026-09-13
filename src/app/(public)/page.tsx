import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import HomeClient from './HomeClient'

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

  return <HomeClient featuredProperties={serializedProperties} />
}
