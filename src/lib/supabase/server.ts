// =============================================================================
// Supabase Server Client - Enterprise Grade
// Golden Garopaba
// =============================================================================
// Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
// =============================================================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side operations.
 * 
 * IMPORTANT: This function validates environment variables at runtime.
 * If variables are missing, it throws an error with actionable instructions.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fail fast with descriptive error if configuration is missing
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      '[SUPABASE SERVER] Configuration Error:\n' +
      `  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}\n` +
      `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? 'SET' : 'MISSING'}\n` +
      '  Fix: Ensure these are set in .env locally or in apphosting.yaml with availability: [BUILD, RUNTIME]'
    )
  }

  // Strip any wrapping quotes from secret manager values
  const url = supabaseUrl.replace(/^["']|["']$/g, '')
  const key = supabaseKey.replace(/^["']|["']$/g, '')

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The setAll method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}
