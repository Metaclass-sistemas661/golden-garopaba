import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'
import HomeClient from './HomeClient'
import { PROPERTY_CARD_SELECT, serializePropertyCard } from '@/utils/serializers'
import { FEATURED_PROPERTIES_TAG } from '@/lib/cacheTags'

// A página continua sendo renderizada sob demanda (não depende do banco no build),
// mas a consulta ao Postgres é servida pelo Data Cache — evitando uma ida ao banco
// (região us-west-2) a cada visita. Invalidação imediata via tag nas mutações de imóveis.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Golden Imóveis Garopaba | Imóveis de Luxo',
  description: 'A principal imobiliária de luxo em Garopaba. Encontre mansões exclusivas e coberturas espetaculares.',
}

const getFeaturedProperties = unstable_cache(
  async () => {
    const properties = await prisma.property.findMany({
      where: { featured: true },
      select: PROPERTY_CARD_SELECT,
      take: 3,
      orderBy: { createdAt: 'desc' },
    })
    return properties.map(serializePropertyCard)
  },
  ['home-featured-properties'],
  { tags: [FEATURED_PROPERTIES_TAG], revalidate: 300 }
)

export default async function Home() {
  const featuredProperties = await getFeaturedProperties()
  return <HomeClient featuredProperties={featuredProperties} />
}
