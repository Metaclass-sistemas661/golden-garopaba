import PropertyDetails from '@/components/public/PropertyDetails'
import ViewTracker from '@/components/public/ViewTracker'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { serializeProperty } from '@/utils/serializers'

export const dynamic = 'force-dynamic'

interface PropertyPageProps {
  params: Promise<{ id: string }>
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params
  
  const property = await prisma.property.findUnique({
    where: { id }
  })
  
  if (!property) {
    notFound()
  }

  const similarProperties = await prisma.property.findMany({
    where: { 
      category: property.category,
      id: { not: property.id }
    },
    take: 3,
    orderBy: { createdAt: 'desc' }
  })
  
  return (
    <>
      <ViewTracker propertyId={property.id} />
      <PropertyDetails 
        property={serializeProperty(property)} 
        similarProperties={similarProperties.map(serializeProperty)} 
      />
    </>
  )
}
