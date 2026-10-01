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
  
  // UUID Validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }
  
  let property = null;
  let similarProperties = [];

  try {
    property = await prisma.property.findUnique({
      where: { id }
    })
    
    if (!property) {
      notFound()
    }

    similarProperties = await prisma.property.findMany({
    where: { 
      category: property.category,
      id: { not: property.id }
    },
    take: 3,
    orderBy: { createdAt: 'desc' }
  })
  } catch (error) {
    console.error("Error fetching property:", error);
    notFound();
  }
  
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
