import { Property, Broker } from '@prisma/client';

export type PropertyDTO = Omit<Property, 'price' | 'rentPrice' | 'condoPrice' | 'iptuPrice' | 'areaTotal' | 'areaUseful' | 'createdAt' | 'updatedAt'> & {
  price: number;
  rentPrice: number | null;
  condoPrice: number | null;
  iptuPrice: number | null;
  areaTotal: number | null;
  areaUseful: number | null;
  latitude: number | null;
  longitude: number | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BrokerDTO = Omit<Broker, 'commissionPercentageSale' | 'commissionPercentageRent' | 'salesGoalQuarterly' | 'createdAt' | 'updatedAt' | 'birthDate' | 'hiredAt'> & {
  commissionPercentageSale: number | null;
  commissionPercentageRent: number | null;
  salesGoalQuarterly: number | null;
  createdAt: string;
  updatedAt: string;
  birthDate: string | null;
  hiredAt: string | null;
}
