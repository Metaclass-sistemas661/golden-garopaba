import PropertyForm from '@/components/admin/PropertyForm'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditarImovel({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const property = await prisma.property.findUnique({
    where: { id: resolvedParams.id }
  })

  if (!property) {
    notFound()
  }

  // Serialização dos decimais e datas
  const serializedProperty = {
    ...property,
    price: property.price ? parseFloat(property.price.toString()) : 0,
    rentPrice: property.rentPrice ? parseFloat(property.rentPrice.toString()) : null,
    condoPrice: property.condoPrice ? parseFloat(property.condoPrice.toString()) : null,
    iptuPrice: property.iptuPrice ? parseFloat(property.iptuPrice.toString()) : null,
    areaTotal: property.areaTotal ? parseFloat(property.areaTotal.toString()) : null,
    areaUseful: property.areaUseful ? parseFloat(property.areaUseful.toString()) : null,
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
  }

  return <PropertyForm isEdit={true} initialData={serializedProperty} />
}
