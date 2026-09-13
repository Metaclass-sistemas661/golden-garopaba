// =============================================================================
// Next.js Middleware - Enterprise Grade
// Golden Garopaba
// =============================================================================
// This middleware handles:
// 1. Supabase session management (cookie refresh)
// 2. Route protection (admin panel requires authentication)
// 3. Authentication redirects
// =============================================================================

import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

/**
 * Main middleware function.
 * IMPORTANT: This file MUST be named `middleware.ts` and located in `src/` 
 * for Next.js to recognize and execute it.
 */
export async function middleware(request: NextRequest) {
  // Validate that Supabase environment variables are configured
  // This check runs on every request to catch configuration issues early
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Log detailed error for debugging in Cloud Run logs
    console.error('[MIDDLEWARE] FATAL: Supabase environment variables not configured')
    console.error(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}`)
    console.error(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? 'SET' : 'MISSING'}`)
    console.error('  Fix: Ensure apphosting.yaml has availability: [BUILD, RUNTIME] for NEXT_PUBLIC_* vars')
    
    // Return a user-friendly error page instead of crashing
    return new NextResponse(
      JSON.stringify({ 
        error: 'Configuration Error',
        message: 'The application is not properly configured. Please contact support.',
        code: 'ENV_MISSING_SUPABASE'
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Delegate to Supabase middleware for session management and route protection
  return await updateSession(request)
}

/**
 * Matcher configuration - defines which routes the middleware applies to.
 * Excludes static assets and images for performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
