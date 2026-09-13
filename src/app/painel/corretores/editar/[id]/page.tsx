import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import BrokerForm from '@/components/admin/BrokerForm'

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

  // Converter Decimal e Date para format compatível com cliente
  const safeBroker = {
    ...broker,
    commissionPercentageSale: Number(broker.commissionPercentageSale),
    commissionPercentageRent: Number(broker.commissionPercentageRent),
    salesGoalQuarterly: broker.salesGoalQuarterly ? Number(broker.salesGoalQuarterly) : null,
    birthDate: broker.birthDate ? broker.birthDate.toISOString() : null,
    hiredAt: broker.hiredAt ? broker.hiredAt.toISOString() : null,
  }

  return <BrokerForm initialData={safeBroker} />
}
