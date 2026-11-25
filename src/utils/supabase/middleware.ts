// =============================================================================
// Supabase Middleware Utilities - Enterprise Grade
// Golden Garopaba
// =============================================================================
// Handles session refresh and route protection for authenticated routes.
// =============================================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function getSupabaseEnv(): { url: string; key: string } {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!rawUrl || !rawKey) {
    throw new Error(
      '[SUPABASE] FATAL: Missing environment variables.\n' +
      `  NEXT_PUBLIC_SUPABASE_URL: ${rawUrl ? 'SET' : 'MISSING'}\n` +
      `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${rawKey ? 'SET' : 'MISSING'}\n` +
      '  Fix: Ensure apphosting.yaml has availability: [BUILD, RUNTIME] for these secrets.'
    )
  }

  const url = rawUrl.replace(/^["']|["']$/g, '')
  const key = rawKey.replace(/^["']|["']$/g, '')

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    throw new Error(
      `[SUPABASE] FATAL: Invalid NEXT_PUBLIC_SUPABASE_URL format.\n` +
      `  Expected: https://<project>.supabase.co\n` +
      `  Received: "${url.substring(0, 50)}..."`
    )
  }

  return { url, key }
}

/**
 * Apenas rotas administrativas e de autenticação precisam validar sessão remota
 * no middleware. Rotas públicas passam direto sem latência de rede extra.
 */
function requiresSessionCheck(pathname: string): boolean {
  return (
    pathname.startsWith('/painel') ||
    pathname === '/login' ||
    pathname === '/redefinir-senha' ||
    pathname.startsWith('/api/admin')
  )
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!requiresSessionCheck(pathname)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const { url, key } = getSupabaseEnv()

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (pathname.startsWith('/painel') && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname === '/login' && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/painel'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
