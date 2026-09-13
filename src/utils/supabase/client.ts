import { createBrowserClient } from '@supabase/ssr'

/**
 * Singleton client for browser environments.
 * This guarantees we don't recreate the client unnecessarily on the client-side.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
  )
}
