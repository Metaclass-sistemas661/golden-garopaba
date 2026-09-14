import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'overview';

  try {
    if (mode === 'overview') {
      const properties = await prisma.property.findMany({
        select: { id: true, title: true, code: true, featured: true, status: true, location: true, latitude: true, longitude: true, transactionType: true }
      });

      const withCoords = properties.filter(p => p.latitude !== null && p.longitude !== null);
      const withoutCoords = properties.filter(p => p.latitude === null || p.longitude === null);

      return NextResponse.json({
        total: properties.length,
        withCoordinates: withCoords.length,
        withoutCoordinates: withoutCoords.length,
        propertiesMissingCoords: withoutCoords.map(p => ({
          id: p.id,
          code: p.code,
          title: p.title,
          location: p.location,
          transactionType: p.transactionType
        })),
        propertiesWithCoords: withCoords.map(p => ({
          id: p.id,
          code: p.code,
          title: p.title,
          latitude: p.latitude,
          longitude: p.longitude,
          transactionType: p.transactionType
        }))
      });
    }

    if (mode === 'test-geocoding') {
      const address = searchParams.get('address') || 'Garopaba, SC, Brasil';
      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json({ error: 'API Key não configurada' }, { status: 500 });
      }

      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=br&language=pt-BR`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return NextResponse.json({
        input: address,
        apiKeyPresent: !!apiKey,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        geocodingResult: data
      });
    }

    if (mode === 'schema-check') {
      // Verify columns exist by querying with them
      try {
        const sample = await prisma.property.findFirst({
          select: { id: true, latitude: true, longitude: true }
        });
        return NextResponse.json({
          columnsExist: true,
          sample: sample || 'No properties found',
          message: 'Colunas latitude/longitude existem no banco'
        });
      } catch (err) {
        return NextResponse.json({
          columnsExist: false,
          error: err instanceof Error ? err.message : String(err),
          message: '❌ Colunas latitude/longitude NÃO existem! Execute a migration 0012.'
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Mode inválido. Use: overview, test-geocoding, schema-check' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

