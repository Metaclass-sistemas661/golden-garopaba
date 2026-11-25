import { Property, Broker, Prisma } from '@prisma/client';
import { PropertyDTO, BrokerDTO } from '@/types/dto';

/**
 * Projeção leve para listagens/cards (evita trafegar HTML gigante de `description`).
 */
export const PROPERTY_CARD_SELECT = {
  id: true,
  code: true,
  title: true,
  price: true,
  rentPrice: true,
  condoPrice: true,
  iptuPrice: true,
  transactionType: true,
  category: true,
  propertyType: true,
  status: true,
  location: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
  zipCode: true,
  bedrooms: true,
  suites: true,
  bathrooms: true,
  parkingSpaces: true,
  areaTotal: true,
  areaUseful: true,
  features: true,
  leisure: true,
  security: true,
  furniture: true,
  environments: true,
  infrastructure: true,
  photos: true,
  tourLink: true,
  videoLink: true,
  latitude: true,
  longitude: true,
  financeable: true,
  featured: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PropertySelect;

export type PropertyCardRow = Prisma.PropertyGetPayload<{
  select: typeof PROPERTY_CARD_SELECT;
}>;

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
    street: p.street ?? null,
    number: p.number ?? null,
    complement: p.complement ?? null,
    neighborhood: p.neighborhood ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    zipCode: p.zipCode ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function serializePropertyCard(p: PropertyCardRow): PropertyDTO {
  return {
    ...p,
    description: '',
    photos: p.photos.length > 0 ? [p.photos[0]] : [],
    price: p.price ? parseFloat(p.price.toString()) : 0,
    rentPrice: p.rentPrice ? parseFloat(p.rentPrice.toString()) : null,
    condoPrice: p.condoPrice ? parseFloat(p.condoPrice.toString()) : null,
    iptuPrice: p.iptuPrice ? parseFloat(p.iptuPrice.toString()) : null,
    areaTotal: p.areaTotal ? parseFloat(p.areaTotal.toString()) : null,
    areaUseful: p.areaUseful ? parseFloat(p.areaUseful.toString()) : null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    street: p.street ?? null,
    number: p.number ?? null,
    complement: p.complement ?? null,
    neighborhood: p.neighborhood ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    zipCode: p.zipCode ?? null,
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
