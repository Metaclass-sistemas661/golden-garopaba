'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export type AuthState = {
  error?: string;
  success?: string;
};

export async function login(prevState: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Preencha todos os campos.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'E-mail ou senha incorretos' }
  }

  // The redirect is intentionally outside the try/catch or error check, 
  // Next.js redirect throws a specific error caught by the framework.
  redirect('/admin')
}

export async function resetPassword(prevState: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'E-mail é obrigatório.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/redefinir-senha`,
  })

  if (error) {
    return { error: 'Erro ao enviar e-mail de recuperação. Verifique o e-mail digitado.' }
  }

  return { success: 'Verifique seu e-mail para redefinir a senha.' }
}

export async function updatePassword(prevState: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const password = formData.get('password') as string

  if (!password || password.length < 6) {
    return { error: 'A nova senha deve ter pelo menos 6 caracteres.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: 'Erro ao atualizar a senha. O link pode ter expirado.' }
  }

  redirect('/login')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
