// =============================================================================
// Supabase Browser Client - Enterprise Grade
// Golden Garopaba
// =============================================================================
// Creates a Supabase client for browser/client-side operations.
// =============================================================================

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for client-side operations.
 * 
 * IMPORTANT: NEXT_PUBLIC_* variables are inlined at build time.
 * If the build runs without these variables, the client will fail.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fail fast with descriptive error if configuration is missing
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      '[SUPABASE CLIENT] Configuration Error:\n' +
      `  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}\n` +
      `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? 'SET' : 'MISSING'}\n` +
      '  Fix: Ensure these are set in .env locally or in apphosting.yaml with availability: [BUILD, RUNTIME]'
    )
  }

  // Strip any wrapping quotes from secret manager values
  const url = supabaseUrl.replace(/^["']|["']$/g, '')
  const key = supabaseKey.replace(/^["']|["']$/g, '')

  return createBrowserClient(url, key)
}
