import PropertyDetails from '@/components/public/PropertyDetails'
import ViewTracker from '@/components/public/ViewTracker'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'

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
  
  const serializeProperty = (p: any) => ({
    ...p,
    price: p.price ? parseFloat(p.price.toString()) : 0,
    rentPrice: p.rentPrice ? parseFloat(p.rentPrice.toString()) : null,
    condoPrice: p.condoPrice ? parseFloat(p.condoPrice.toString()) : null,
    iptuPrice: p.iptuPrice ? parseFloat(p.iptuPrice.toString()) : null,
    areaTotal: p.areaTotal ? parseFloat(p.areaTotal.toString()) : null,
    areaUseful: p.areaUseful ? parseFloat(p.areaUseful.toString()) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
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
