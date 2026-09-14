import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        code: true,
        title: true,
        location: true,
        street: true,
        number: true,
        neighborhood: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const withCoords = properties.filter(p => p.latitude !== null && p.longitude !== null).length
    const withoutCoords = properties.filter(p => p.latitude === null || p.longitude === null).length

    return NextResponse.json({
      properties,
      stats: {
        total: properties.length,
        withCoords,
        withoutCoords,
      },
    })
  } catch (error) {
    console.error('[API] Erro ao buscar imóveis:', error)
    return NextResponse.json({ error: 'Erro ao carregar imóveis' }, { status: 500 })
  }
}
