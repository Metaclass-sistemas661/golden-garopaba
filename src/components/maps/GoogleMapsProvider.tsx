'use client'

import { APIProvider } from '@vis.gl/react-google-maps'
import { ReactNode } from 'react'

interface GoogleMapsProviderProps {
  children: ReactNode
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error('Google Maps API Key não configurada')
    return <>{children}</>
  }

  return (
    <APIProvider apiKey={apiKey}>
      {children}
    </APIProvider>
  )
}
