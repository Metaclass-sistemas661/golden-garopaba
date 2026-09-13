import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import BrokerForm from '@/components/admin/BrokerForm'
import { serializeBroker } from '@/utils/serializers'

interface EditarCorretorProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditarCorretorPage({ params }: EditarCorretorProps) {
  const { id } = await params;
  const broker = await prisma.broker.findUnique({
    where: { id }
  })

  if (!broker) {
    notFound()
  }

  const safeBroker = serializeBroker(broker)

  return <BrokerForm initialData={safeBroker} />
}
