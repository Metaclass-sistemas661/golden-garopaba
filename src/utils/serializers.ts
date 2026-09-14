import { Property, Broker } from '@prisma/client';
import { PropertyDTO, BrokerDTO } from '@/types/dto';

export function serializeProperty(p: Property): PropertyDTO {
  return {
    ...p,
    price: p.price ? parseFloat(p.price.toString()) : 0,
    rentPrice: p.rentPrice ? parseFloat(p.rentPrice.toString()) : null,
    condoPrice: p.condoPrice ? parseFloat(p.condoPrice.toString()) : null,
    iptuPrice: p.iptuPrice ? parseFloat(p.iptuPrice.toString()) : null,
    areaTotal: p.areaTotal ? parseFloat(p.areaTotal.toString()) : null,
    areaUseful: p.areaUseful ? parseFloat(p.areaUseful.toString()) : null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function serializeBroker(b: Broker): BrokerDTO {
  return {
    ...b,
    commissionPercentageSale: b.commissionPercentageSale ? parseFloat(b.commissionPercentageSale.toString()) : null,
    commissionPercentageRent: b.commissionPercentageRent ? parseFloat(b.commissionPercentageRent.toString()) : null,
    salesGoalQuarterly: b.salesGoalQuarterly ? parseFloat(b.salesGoalQuarterly.toString()) : null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    birthDate: b.birthDate ? b.birthDate.toISOString() : null,
    hiredAt: b.hiredAt ? b.hiredAt.toISOString() : null,
  };
}
