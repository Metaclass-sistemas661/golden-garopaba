import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const propertyId = body?.propertyId

    if (typeof propertyId !== 'string' || !UUID_REGEX.test(propertyId)) {
      return NextResponse.json({ error: 'Valid Property ID is required' }, { status: 400 })
    }

    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
    const userAgent = (request.headers.get('user-agent') || 'unknown').slice(0, 500)

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const recentView = await prisma.propertyView.findFirst({
      where: {
        propertyId,
        ipAddress: ip,
        createdAt: { gte: yesterday }
      },
      select: { id: true }
    })

    if (recentView) {
      return NextResponse.json({ message: 'View already counted recently' }, { status: 200 })
    }

    await prisma.propertyView.create({
      data: {
        propertyId,
        ipAddress: ip,
        userAgent
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking view:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
