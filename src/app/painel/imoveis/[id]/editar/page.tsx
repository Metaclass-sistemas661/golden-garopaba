import PropertyForm from '@/components/admin/PropertyForm'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { serializeProperty } from '@/utils/serializers'

export const dynamic = 'force-dynamic'

export default async function EditarImovel({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const property = await prisma.property.findUnique({
    where: { id: resolvedParams.id }
  })

  if (!property) {
    notFound()
  }

  const serialized = serializeProperty(property)

  return <PropertyForm isEdit={true} initialData={serialized} />
}
