"use client"
// Trigger rebuild for CSS module
import { useState } from 'react'
import { Save, Building2, Palette, Link as LinkIcon, ShieldCheck, UploadCloud, Copy, CheckCircle2, Loader2 } from 'lucide-react'
import styles from './page.module.css'
import { updateSettings } from '@/app/actions/settings'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function ClientPage({ initialSettings }: { initialSettings: import('@prisma/client').SystemSettings | null }) {
  const [activeTab, setActiveTab] = useState('geral')
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Estados dos campos
  const [companyName, setCompanyName] = useState(initialSettings?.companyName || '')
  const [companyLegalName, setCompanyLegalName] = useState(initialSettings?.companyLegalName || '')
  const [cnpj, setCnpj] = useState(initialSettings?.cnpj || '')
  const [creci, setCreci] = useState(initialSettings?.creci || '')
  const [email, setEmail] = useState(initialSettings?.email || '')
  
  const [colorPrimary, setColorPrimary] = useState(initialSettings?.colorPrimary || '#0f172a')
  const [colorSecondary, setColorSecondary] = useState(initialSettings?.colorSecondary || '#f8fafc')
  const [typography, setTypography] = useState(initialSettings?.typography || 'inter')

  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings?.whatsappNumber || '')
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(initialSettings?.googleAnalyticsId || '')
  const [metaPixelId, setMetaPixelId] = useState(initialSettings?.metaPixelId || '')

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialSettings?.twoFactorEnabled || false)
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logoUrl || '')
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const supabase = createClient()

  const handleCopyXML = () => {
    navigator.clipboard.writeText('https://api.garopaba.com.br/xml/zap-imoveis')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoUrl(URL.createObjectURL(file))
    }
  }

  const uploadLogo = async () => {
    if (!logoFile) return logoUrl

    const fileExt = logoFile.name.split('.').pop()
    const fileName = `logo_${Date.now()}.${fileExt}`
    const filePath = `settings/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('properties') // Usando o bucket público existente
      .upload(filePath, logoFile)

    if (uploadError) {
      console.error('Erro no upload da logo:', uploadError)
      return logoUrl
    }

    const { data: publicUrlData } = supabase.storage
      .from('properties')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const finalLogoUrl = await uploadLogo()

      const payload = {
        companyName,
        companyLegalName,
        cnpj,
        creci,
        email,
        colorPrimary,
        colorSecondary,
        typography,
        whatsappNumber,
        googleAnalyticsId,
        metaPixelId,
        twoFactorEnabled,
        logoUrl: finalLogoUrl
      }

      const res = await updateSettings(payload)

      if (res.success) {
        alert('Configurações salvas com sucesso!')
      } else {
        alert(res.error || 'Erro ao salvar configurações.')
      }
    } catch (error) {
      console.error(error)
      alert('Erro inesperado ao salvar configurações.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configurações do Sistema</h1>
          <p className={styles.subtitle}>Gerencie a identidade visual, integrações e segurança da sua imobiliária.</p>
        </div>
        <button type="submit" form="settingsForm" className={styles.saveBtn} disabled={isSaving}>
          {isSaving ? <Loader2 size={20} className={styles.spinner} /> : <Save size={20} />}
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <button 
            className={`${styles.navItem} ${activeTab === 'geral' ? styles.active : ''}`}
            onClick={() => setActiveTab('geral')}
          >
            <Building2 size={18} /> Minha Imobiliária
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'aparencia' ? styles.active : ''}`}
            onClick={() => setActiveTab('aparencia')}
          >
            <Palette size={18} /> Aparência e Marca
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'integracoes' ? styles.active : ''}`}
            onClick={() => setActiveTab('integracoes')}
          >
            <LinkIcon size={18} /> Integrações (API & XML)
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'seguranca' ? styles.active : ''}`}
            onClick={() => setActiveTab('seguranca')}
          >
            <ShieldCheck size={18} /> Segurança
          </button>
        </aside>

        <form id="settingsForm" className={styles.content} onSubmit={handleSave}>
          
          {/* TAB: GERAL */}
          {activeTab === 'geral' && (
            <div className={styles.tabPane}>
              <h2 className={styles.tabTitle}>Dados da Imobiliária</h2>
              
              <div className={styles.logoSection}>
                <div className={styles.logoPreview} style={{ position: 'relative' }}>
                  {logoUrl ? (
                    <Image src={logoUrl} alt="Logo Oficial" fill unoptimized style={{ objectFit: 'contain' }} />
                  ) : (
                    <Building2 size={48} color="#94a3b8" />
                  )}
                </div>
                <div className={styles.logoActions}>
                  <h4>Logo Oficial</h4>
                  <p>Essa logo aparecerá no cabeçalho do seu site e nos contratos gerados.</p>
                  <label className={styles.uploadBtn} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'max-content' }}>
                    <UploadCloud size={16} /> Fazer Upload
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Nome Fantasia</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Razão Social</label>
                  <input type="text" value={companyLegalName} onChange={e => setCompanyLegalName(e.target.value)} />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>CNPJ</label>
                  <input type="text" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>CRECI Jurídico</label>
                  <input type="text" value={creci} onChange={e => setCreci(e.target.value)} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>E-mail de Contato Principal</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
          )}

          {/* TAB: APARÊNCIA */}
          {activeTab === 'aparencia' && (
            <div className={styles.tabPane}>
              <h2 className={styles.tabTitle}>Identidade Visual do Site</h2>
              
              <div className={styles.formGroup}>
                <label>Cor Primária (Botões e Destaques)</label>
                <div className={styles.colorPickerWrapper}>
                  <input type="color" value={colorPrimary} onChange={e => setColorPrimary(e.target.value)} className={styles.colorInput} />
                  <span className={styles.colorHex}>{colorPrimary.toUpperCase()}</span>
                </div>
                <p className={styles.helpText}>Essa é a cor principal que seus clientes verão nos botões de &quot;Falar com Corretor&quot;.</p>
              </div>

              <div className={styles.formGroup}>
                <label>Cor Secundária (Fundos e Rodapé)</label>
                <div className={styles.colorPickerWrapper}>
                  <input type="color" value={colorSecondary} onChange={e => setColorSecondary(e.target.value)} className={styles.colorInput} />
                  <span className={styles.colorHex}>{colorSecondary.toUpperCase()}</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Tipografia Padrão</label>
                <select value={typography} onChange={e => setTypography(e.target.value)}>
                  <option value="inter">Inter (Moderno e Limpo)</option>
                  <option value="roboto">Roboto (Clássico Google)</option>
                  <option value="playfair">Playfair Display (Elegante / Alto Padrão)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB: INTEGRAÇÕES */}
          {activeTab === 'integracoes' && (
            <div className={styles.tabPane}>
              <h2 className={styles.tabTitle}>Integrações e APIs</h2>
              
              <div className={styles.integrationCard}>
                <div className={styles.integrationHeader}>
                  <div>
                    <h3>Link XML para Portais (Zap / Viva Real)</h3>
                    <p>Use esta URL para alimentar automaticamente sua conta nos portais imobiliários. Ela é atualizada em tempo real.</p>
                  </div>
                </div>
                <div className={styles.xmlBox}>
                  <code>https://api.garopaba.com.br/xml/zap-imoveis</code>
                  <button type="button" className={styles.copyBtn} onClick={handleCopyXML}>
                    {copied ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.integrationCard}>
                <h3>WhatsApp Business API</h3>
                <div className={styles.formGroup}>
                  <label>Número Principal do Robô/Atendimento</label>
                  <input type="text" placeholder="+55 (00) 00000-0000" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} />
                </div>
              </div>

              <div className={styles.integrationCard}>
                <h3>Rastreamento (Analytics)</h3>
                <div className={styles.formGroup}>
                  <label>ID de Medição do Google Analytics (G-XXXXXXX)</label>
                  <input type="text" placeholder="G-" value={googleAnalyticsId} onChange={e => setGoogleAnalyticsId(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Pixel do Meta (Facebook/Instagram)</label>
                  <input type="text" placeholder="Cole o ID do seu Pixel" value={metaPixelId} onChange={e => setMetaPixelId(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* TAB: SEGURANÇA */}
          {activeTab === 'seguranca' && (
            <div className={styles.tabPane}>
              <h2 className={styles.tabTitle}>Segurança da Conta</h2>
              
              <div className={styles.securityBox}>
                <div>
                  <h3>Autenticação em Dois Fatores (2FA)</h3>
                  <p>Adiciona uma camada extra de segurança usando o Google Authenticator.</p>
                </div>
                <button type="button" className={styles.toggleBtn} onClick={() => setTwoFactorEnabled(!twoFactorEnabled)} style={{ background: twoFactorEnabled ? '#10b981' : '#f59e0b' }}>
                  {twoFactorEnabled ? '2FA Ativado' : 'Ativar 2FA'}
                </button>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#1e293b' }}>Alterar Senha do Painel</h3>
                <div className={styles.formGroup}>
                  <label>Senha Atual</label>
                  <input type="password" />
                </div>
                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label>Nova Senha</label>
                    <input type="password" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Confirmar Nova Senha</label>
                    <input type="password" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
