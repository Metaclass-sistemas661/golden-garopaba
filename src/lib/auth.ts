import { createClient } from '@/lib/supabase/server'

export class UnauthorizedError extends Error {
  constructor(message = 'Sessão expirada ou não autorizada. Faça login novamente.') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

/**
 * Garante que a chamada atual (Server Action ou Route Handler) pertence a um
 * usuário autenticado no Supabase.
 */
export async function requireAdminAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new UnauthorizedError()
  }

  return user
}
