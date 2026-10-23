import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveProperty } from '@/app/actions/properties'

export const dynamic = 'force-dynamic'

/**
 * Endpoint REST para salvar/editar imóvel no painel administrativo.
 *
 * Por que esta rota existe em conjunto com a Server Action:
 * Next.js Server Actions usam hashes dinâmicos gerados no build. Se um deploy
 * ocorre enquanto o usuário está com o formulário aberto, a Server Action falha
 * com "UnrecognizedActionError" (deployment skew).
 *
 * Rotas HTTP fixas (/api/admin/properties) NUNCA quebram por descompasso de build.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Sessão expirada. Faça login novamente.' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body || !body.payload) {
      return NextResponse.json({ success: false, error: 'Payload inválido.' }, { status: 400 })
    }

    const { payload, isEdit, id } = body
    const res = await saveProperty(payload, !!isEdit, id)

    if (!res.success) {
      return NextResponse.json(res, { status: 400 })
    }

    return NextResponse.json(res, { status: 200 })
  } catch (error) {
    console.error('[API] Erro ao salvar imóvel:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor ao salvar imóvel.'
    }, { status: 500 })
  }
}
