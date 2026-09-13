import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const properties = await prisma.property.findMany({
    select: { id: true, title: true, featured: true, status: true }
  });
  return NextResponse.json(properties);
}
