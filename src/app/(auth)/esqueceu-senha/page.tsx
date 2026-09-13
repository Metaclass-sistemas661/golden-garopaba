'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { resetPassword } from '@/app/actions/auth'
import styles from '../login/login.module.css'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={styles.submitBtn} disabled={pending}>
      {pending ? 'Enviando...' : 'Enviar Link de Recuperação'}
    </button>
  )
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(resetPassword, undefined)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Recuperar Senha</h1>
      <p className={styles.subtitle}>Digite seu e-mail para receber um link de redefinição</p>

      {state?.error && (
        <div className={styles.errorAlert}>
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className={styles.successAlert}>
          {state.success}
        </div>
      )}

      <form className={styles.form} action={formAction}>
        <div className={styles.formGroup}>
          <label htmlFor="email">E-mail</label>
          <input type="email" id="email" name="email" required placeholder="seu@email.com" />
        </div>

        <SubmitButton />
      </form>

      <div className={styles.links}>
        <Link href="/login" className={styles.link}>
          ← Voltar para o Login
        </Link>
      </div>
    </div>
  )
}
