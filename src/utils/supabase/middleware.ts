// =============================================================================
// Supabase Middleware Utilities - Enterprise Grade
// Golden Garopaba
// =============================================================================
// Handles session refresh and route protection for authenticated routes.
// =============================================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Validates and retrieves Supabase environment variables.
 * Fails fast with descriptive errors if configuration is invalid.
 */
function getSupabaseEnv(): { url: string; key: string } {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fail fast if variables are missing - never use fallback URLs
  if (!rawUrl || !rawKey) {
    throw new Error(
      '[SUPABASE] FATAL: Missing environment variables.\n' +
      `  NEXT_PUBLIC_SUPABASE_URL: ${rawUrl ? 'SET' : 'MISSING'}\n` +
      `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${rawKey ? 'SET' : 'MISSING'}\n` +
      '  Fix: Ensure apphosting.yaml has availability: [BUILD, RUNTIME] for these secrets.'
    )
  }

  // Strip wrapping quotes that some secret managers inject
  const url = rawUrl.replace(/^["']|["']$/g, '')
  const key = rawKey.replace(/^["']|["']$/g, '')

  if (url !== rawUrl || key !== rawKey) {
    console.warn(
      '[SUPABASE] WARNING: Environment variables contain wrapping quotes.\n' +
      '  Fix the secret values in Google Cloud Secret Manager to remove them.'
    )
  }

  // Validate URL format
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
 * Updates the Supabase session by refreshing tokens stored in cookies.
 * Also handles route protection for authenticated areas.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ---------------------------------------------------------------------------
  // Route Protection - Enterprise Security
  // ---------------------------------------------------------------------------
  
  // Protected routes: /painel/* requires authentication
  if (request.nextUrl.pathname.startsWith('/painel') && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    // Optionally preserve the original destination for post-login redirect
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Prevent authenticated users from accessing login page
  if (request.nextUrl.pathname === '/login' && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/painel'
    return NextResponse.redirect(redirectUrl)
  }

  // ---------------------------------------------------------------------------
  // Future Enhancement: Role-Based Access Control (RBAC)
  // ---------------------------------------------------------------------------
  // TODO: Verify user role in database to enforce admin-only access to /painel
  // const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  // if (profile?.role !== 'ADMIN') { redirect to unauthorized page }

  return supabaseResponse
}
