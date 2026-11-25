import { cache } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PropertyDetails from '@/components/public/PropertyDetails'
import ViewTracker from '@/components/public/ViewTracker'
import prisma from '@/lib/prisma'
import { PROPERTY_CARD_SELECT, serializeProperty, serializePropertyCard } from '@/utils/serializers'
import { getSettings } from '@/app/actions/settings'
import { formatPropertyPriceLabel } from '@/utils/propertyDisplay'

export const dynamic = 'force-dynamic'

interface PropertyPageProps {
  params: Promise<{ id: string }>
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const getPropertyById = cache(async (id: string) => {
  if (!UUID_REGEX.test(id)) return null
  return prisma.property.findUnique({ where: { id } })
})

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { id } = await params
  const property = await getPropertyById(id).catch(() => null)
  if (!property) {
    return { title: 'Imóvel não encontrado' }
  }

  const priceLabel = formatPropertyPriceLabel({
    transactionType: property.transactionType,
    price: Number(property.price || 0),
    rentPrice: property.rentPrice ? Number(property.rentPrice) : null,
  })

  return {
    title: `${property.title} (${property.code})`,
    description: `${property.propertyType} em ${property.location || 'Garopaba, SC'} — ${priceLabel}.`,
    openGraph: property.photos[0]
      ? { images: [{ url: property.photos[0], alt: property.title }] }
      : undefined,
  }
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params
  if (!UUID_REGEX.test(id)) {
    notFound()
  }

  let property = null
  try {
    property = await getPropertyById(id)
  } catch (error) {
    console.error('Error fetching property:', error)
    notFound()
  }

  if (!property) {
    notFound()
  }

  const [similarProperties, settings] = await Promise.all([
    prisma.property.findMany({
      where: {
        category: property.category,
        status: 'AVAILABLE',
        id: { not: property.id }
      },
      select: PROPERTY_CARD_SELECT,
      take: 3,
      orderBy: { createdAt: 'desc' }
    }).catch(() => []),
    getSettings(),
  ])

  return (
    <>
      <ViewTracker propertyId={property.id} />
      <PropertyDetails
        property={serializeProperty(property)}
        similarProperties={similarProperties.map(serializePropertyCard)}
        whatsappNumber={settings?.whatsappNumber}
      />
    </>
  )
}
