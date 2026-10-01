'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Pode logar para um serviço como Sentry aqui
    console.error('Unhandled Global Error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <AlertTriangle size={64} color="#d4af37" style={{ marginBottom: '1.5rem' }} />
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Ops! Algo deu errado.
      </h1>
      <p style={{ fontSize: '1.125rem', color: '#64748b', maxWidth: '600px', marginBottom: '2rem' }}>
        Encontramos um erro inesperado ao carregar esta página. Nossa equipe já foi notificada. 
        {error.digest && <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem' }}>Código do Erro: {error.digest}</span>}
      </p>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          onClick={() => reset()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Tentar Novamente
        </button>
        <Link 
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f1f5f9',
            color: '#0f172a',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            fontWeight: '500'
          }}
        >
          <Home size={18} />
          Voltar ao Início
        </Link>
      </div>
    </div>
  )
}
