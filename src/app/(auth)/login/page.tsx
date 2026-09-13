"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Building2, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const supabase = createClient()
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoading(false)
      setErrorMsg('Credenciais inválidas. Verifique seu e-mail e senha.')
    } else {
      router.push('/painel')
      router.refresh()
    }
  }

  return (
    <div className={styles.container}>
      
      {/* Lado Esquerdo - Formulário */}
      <div className={styles.formSide}>
        
        {/* Logo / Header */}
        <div className={styles.logoHeader}>
          <Building2 size={32} color="var(--color-primary)" />
          <span className={styles.brandName}>GAROPABA IMÓVEIS</span>
        </div>

        {/* Formulário Centralizado */}
        <div className={styles.formWrapper}>
          <div className={styles.formCard}>
            <h1 className={styles.title}>Acesse sua conta</h1>
            <p className={styles.subtitle}>Bem-vindo(a) de volta! Por favor, insira seus dados.</p>

            {errorMsg && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className={styles.form}>
              
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email"
                  placeholder="admin@imobiliaria.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Senha</label>
                <div className={styles.passwordWrapper}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className={styles.forgotWrapper}>
                <Link href="/recuperar-senha" className={styles.forgotLink}>
                  Esqueceu a senha?
                </Link>
              </div>

              <button type="submit" className={styles.loginBtn} disabled={loading}>
                {loading ? <Loader2 size={20} className={styles.spin} /> : 'Entrar na Plataforma'}
              </button>
            </form>

            <div className={styles.registerWrapper}>
              <p>Ainda não possui conta? <Link href="/cadastro" className={styles.registerLink}>Criar conta grátis</Link></p>
            </div>
          </div>
        </div>

        {/* Footer Simples */}
        <div className={styles.footer}>
          <div className={styles.footerLinks}>
            <Link href="/sobre">Sobre</Link>
            <Link href="/termos">Termos & Condições</Link>
            <Link href="/privacidade">Política de Privacidade</Link>
            <Link href="/contato">Contato</Link>
          </div>
          <p className={styles.copyright}>© 2026 Garopaba Imóveis. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Lado Direito - Textos Sobre a Imagem */}
      <div className={styles.imageOverlay}>
        <div className={styles.imageContent}>
          <h2>Gestão Imobiliária Inteligente</h2>
          <p>O painel de controle perfeito para gerenciar seus imóveis e corretores com alta performance.</p>
        </div>
      </div>
      
    </div>
  )
}
