import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { propertyId } = body

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    // Capture IP Address to prevent flood
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check if this IP already viewed this property in the last 24 hours
    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)

    const recentView = await prisma.propertyView.findFirst({
      where: {
        propertyId,
        ipAddress: ip,
        createdAt: {
          gte: yesterday
        }
      }
    })

    if (recentView) {
      return NextResponse.json({ message: 'View already counted recently' }, { status: 200 })
    }

    // Register View
    await prisma.propertyView.create({
      data: {
        propertyId,
        ipAddress: ip,
        userAgent: userAgent
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking view:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
