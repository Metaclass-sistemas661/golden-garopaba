import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function getSupabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!rawUrl || !rawKey) {
    throw new Error(
      '[SUPABASE] FATAL: Missing environment variables. ' +
      `NEXT_PUBLIC_SUPABASE_URL=${rawUrl ? 'set' : 'MISSING'}, ` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${rawKey ? 'set' : 'MISSING'}. ` +
      'Configure them in apphosting.yaml → env or in your .env file.'
    )
  }

  const url = rawUrl.replace(/^"|"$/g, '')
  const key = rawKey.replace(/^"|"$/g, '')

  if (url !== rawUrl || key !== rawKey) {
    console.warn(
      '[SUPABASE] WARNING: Supabase env vars contain wrapping quotes. ' +
      'Fix the secret values in Google Cloud Secret Manager to remove them.'
    )
  }

  return { url, key }
}

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

  // Middleware Logic for Enterprise Security
  // Se o usuário está acessando rotas de /painel e não está logado, redireciona para o login público.
  if (request.nextUrl.pathname.startsWith('/painel') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se o usuário já está logado, e tenta acessar /login, manda de volta pro painel
  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/painel'
    return NextResponse.redirect(url)
  }

  // IMPORTANTE: Idealmente no futuro também verificaríamos no banco se a `role` do `user` é ADMIN
  // para bloquear acessos de usuários normais que tentem acessar /admin.
  // A verificação de RLS no Prisma/Supabase também reforça essa segurança em nível de banco.

  return supabaseResponse
}
