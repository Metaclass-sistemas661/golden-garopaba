"use client"

import { useEffect } from 'react'

export default function ViewTracker({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    // Registra a visualização no banco de dados silenciosamente
    fetch('/api/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ propertyId })
    }).catch(err => console.error('Erro ao registrar view:', err))
  }, [propertyId])

  return null // Não renderiza nada visualmente
}
