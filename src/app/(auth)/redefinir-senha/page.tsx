'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updatePassword } from '@/app/actions/auth'
import styles from '../login/login.module.css'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={styles.submitBtn} disabled={pending}>
      {pending ? 'Salvando...' : 'Salvar Nova Senha'}
    </button>
  )
}

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(updatePassword, undefined)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Nova Senha</h1>
      <p className={styles.subtitle}>Digite sua nova senha de acesso</p>

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
          <label htmlFor="password">Nova Senha</label>
          <input type="password" id="password" name="password" required placeholder="••••••••" minLength={6} />
        </div>

        <SubmitButton />
      </form>
    </div>
  )
}
