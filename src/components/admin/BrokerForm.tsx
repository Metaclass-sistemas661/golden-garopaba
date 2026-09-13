"use client"

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, UserCircle2, Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import styles from './BrokerForm.module.css'
import { saveBroker } from '@/app/actions/brokers'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatCurrencyInput, parseCurrencyToNumber } from '@/utils/mask'

interface BrokerFormProps {
  initialData?: any
}

export default function BrokerForm({ initialData }: BrokerFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('personal')
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados dos inputs
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  
  const [fullName, setFullName] = useState(initialData?.fullName || '')
  const [displayName, setDisplayName] = useState(initialData?.displayName || '')
  const [creci, setCreci] = useState(initialData?.creci || '')
  const [document, setDocument] = useState(initialData?.document || '')
  const [birthDate, setBirthDate] = useState(initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '')
  
  const [email, setEmail] = useState(initialData?.email || '')
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp || '')
  const [phoneAlt, setPhoneAlt] = useState(initialData?.phoneAlt || '')
  const [address, setAddress] = useState(initialData?.address || '')
  
  const [specialty, setSpecialty] = useState(initialData?.specialty || '')
  const [commissionPercentageSale, setCommissionPercentageSale] = useState(initialData?.commissionPercentageSale ? formatCurrency(initialData.commissionPercentageSale) : '')
  const [commissionPercentageRent, setCommissionPercentageRent] = useState(initialData?.commissionPercentageRent ? formatCurrency(initialData.commissionPercentageRent) : '')
  const [salesGoalQuarterly, setSalesGoalQuarterly] = useState(initialData?.salesGoalQuarterly ? formatCurrency(initialData.salesGoalQuarterly) : '')
  const [status, setStatus] = useState(initialData?.status || 'ACTIVE')
  const [hiredAt, setHiredAt] = useState(initialData?.hiredAt ? new Date(initialData.hiredAt).toISOString().split('T')[0] : '')
  
  const [instagramUrl, setInstagramUrl] = useState(initialData?.instagramUrl || '')
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedinUrl || '')
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtubeUrl || '')

  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  const uploadAvatar = async () => {
    if (!avatarFile) return avatarUrl

    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError, data } = await supabase.storage
      .from('properties')
      .upload(filePath, avatarFile)

    if (uploadError) {
      console.error('Erro no upload da foto:', uploadError)
      return avatarUrl
    }

    const { data: publicUrlData } = supabase.storage
      .from('properties')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const uploadedAvatarUrl = await uploadAvatar()

      const payload = {
        fullName,
        displayName,
        creci,
        document,
        birthDate,
        email,
        whatsapp,
        phoneAlt,
        address,
        specialty,
        commissionPercentageSale: parseCurrencyToNumber(commissionPercentageSale),
        commissionPercentageRent: parseCurrencyToNumber(commissionPercentageRent),
        salesGoalQuarterly: parseCurrencyToNumber(salesGoalQuarterly),
        status,
        hiredAt: hiredAt || null,
        instagramUrl,
        linkedinUrl,
        youtubeUrl,
        avatarUrl: uploadedAvatarUrl
      }

      const res = await saveBroker(payload, !!initialData, initialData?.id)

      if (res.success) {
        router.push('/painel/corretores')
      } else {
        alert(res.error || 'Erro ao salvar corretor.')
      }
    } catch (error) {
      console.error(error)
      alert('Erro inesperado ao salvar.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Link href="/painel/corretores" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={styles.title}>{initialData ? 'Editar Corretor' : 'Cadastrar Corretor Associado'}</h1>
            <p className={styles.subtitle}>Perfil profissional, acesso ao painel e configurações de metas.</p>
          </div>
        </div>
      </div>

      <div className={styles.formLayout}>
        <aside className={styles.formNav}>
          <button className={`${styles.navItem} ${activeTab === 'personal' ? styles.active : ''}`} onClick={() => setActiveTab('personal')} type="button">
            Dados Pessoais
          </button>
          <button className={`${styles.navItem} ${activeTab === 'contact' ? styles.active : ''}`} onClick={() => setActiveTab('contact')} type="button">
            Contato e Endereço
          </button>
          <button className={`${styles.navItem} ${activeTab === 'professional' ? styles.active : ''}`} onClick={() => setActiveTab('professional')} type="button">
            Perfil Profissional
          </button>
          <button className={`${styles.navItem} ${activeTab === 'social' ? styles.active : ''}`} onClick={() => setActiveTab('social')} type="button">
            Redes Sociais
          </button>
        </aside>

        <form id="brokerForm" className={styles.formContent} onSubmit={handleSave}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
          
          {/* TAB 1: Pessoal */}
          <div style={{ display: activeTab === 'personal' ? 'block' : 'none' }}>
            <div className={styles.tabContent}>
              <h2>Informações Pessoais</h2>
              
              <div className={styles.avatarUploadArea}>
                <div className={styles.avatarCircle}>
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar" width={96} height={96} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <UserCircle2 size={48} strokeWidth={1} />
                  )}
                </div>
                <div className={styles.avatarActions}>
                  <strong>Foto de Perfil (Avatar)</strong>
                  <p>Uma foto profissional ajuda a gerar confiança com o cliente.</p>
                  <div>
                    <button type="button" className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                      Escolher Foto...
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Nome Completo (Para contratos)</label>
                <input type="text" placeholder="Ex: Carlos Eduardo de Oliveira" required value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Nome de Exibição (Como o cliente vê)</label>
                  <input type="text" placeholder="Ex: Carlos Oliveira" required value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>CRECI</label>
                  <input type="text" placeholder="Ex: 12345-SC" required value={creci} onChange={e => setCreci(e.target.value)} />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>CPF ou CNPJ (Se PJ)</label>
                  <input type="text" placeholder="Apenas números" value={document} onChange={e => setDocument(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Data de Nascimento</label>
                  <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                </div>
              </div>
              <div className={styles.tabFooter}>
                <button type="button" className={styles.nextBtn} onClick={() => setActiveTab('contact')}>
                  Avançar <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* TAB 2: Contato */}
          <div style={{ display: activeTab === 'contact' ? 'block' : 'none' }}>
            <div className={styles.tabContent}>
              <h2>Dados de Contato</h2>

              <div className={styles.formGroup}>
                <label>E-mail Corporativo</label>
                <input type="email" placeholder="carlos@suaimobiliaria.com.br" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>WhatsApp Profissional</label>
                  <input type="tel" placeholder="(00) 90000-0000" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Telefone Alternativo</label>
                  <input type="tel" placeholder="(00) 0000-0000" value={phoneAlt} onChange={e => setPhoneAlt(e.target.value)} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Endereço Residencial (Faturamento/Contrato)</label>
                <input type="text" placeholder="Rua, Número, Bairro, Cidade - Estado" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div className={`${styles.tabFooter} ${styles.spaceBetween}`}>
                <button type="button" className={styles.prevBtn} onClick={() => setActiveTab('personal')}>
                  <ChevronLeft size={18} /> Anterior
                </button>
                <button type="button" className={styles.nextBtn} onClick={() => setActiveTab('professional')}>
                  Avançar <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* TAB 3: Profissional */}
          <div style={{ display: activeTab === 'professional' ? 'block' : 'none' }}>
            <div className={styles.tabContent}>
              <h2>Gestão de Performance e Metas</h2>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Especialidade de Vendas</label>
                  <select required value={specialty} onChange={e => setSpecialty(e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Alto Padrão">Imóveis de Alto Padrão</option>
                    <option value="Lançamentos">Lançamentos / Na Planta</option>
                    <option value="Comercial">Imóveis Comerciais</option>
                    <option value="Rural">Sítios, Fazendas e Rural</option>
                    <option value="Locação">Especialista em Locação</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Status do Corretor</label>
                  <select required value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="ACTIVE">Ativo - Com acesso ao sistema</option>
                    <option value="VACATION">Em Férias - Sem recebimento de leads</option>
                    <option value="INACTIVE">Inativo - Acesso revogado</option>
                  </select>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Comissão de Venda (%) *</label>
                  <div className={styles.inputWrapper}>
                    <input type="text" placeholder="Ex: 5,00" value={commissionPercentageSale} onChange={e => setCommissionPercentageSale(formatCurrencyInput(e.target.value))} required />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Comissão de Aluguel (%) *</label>
                  <div className={styles.inputWrapper}>
                    <input type="text" placeholder="Ex: 100,00" value={commissionPercentageRent} onChange={e => setCommissionPercentageRent(formatCurrencyInput(e.target.value))} required />
                  </div>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Meta de Vendas Trimestral (R$)</label>
                  <div className={styles.inputWrapper}>
                    <input type="text" placeholder="Ex: 5.000.000,00" value={salesGoalQuarterly} onChange={e => setSalesGoalQuarterly(formatCurrencyInput(e.target.value))} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Data de Início (Contratação)</label>
                  <input type="date" value={hiredAt} onChange={e => setHiredAt(e.target.value)} />
                </div>
              </div>
              <div className={`${styles.tabFooter} ${styles.spaceBetween}`}>
                <button type="button" className={styles.prevBtn} onClick={() => setActiveTab('contact')}>
                  <ChevronLeft size={18} /> Anterior
                </button>
                <button type="button" className={styles.nextBtn} onClick={() => setActiveTab('social')}>
                  Avançar <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* TAB 4: Redes Sociais */}
          <div style={{ display: activeTab === 'social' ? 'block' : 'none' }}>
            <div className={styles.tabContent}>
              <h2>Redes Sociais e Portfólio</h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Esses links poderão aparecer na página de perfil público do corretor no site da imobiliária.
              </p>

              <div className={styles.formGroup}>
                <label>Instagram</label>
                <div className={styles.inputWithPrefix}>
                  <span className={styles.inputPrefix}>instagram.com/</span>
                  <input type="text" placeholder="seuperfil" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>LinkedIn</label>
                <div className={styles.inputWithPrefix}>
                  <span className={styles.inputPrefix}>linkedin.com/in/</span>
                  <input type="text" placeholder="seuperfil" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>YouTube (Canal de Tours Virtuais)</label>
                <div className={styles.inputWithPrefix}>
                  <span className={styles.inputPrefix}>youtube.com/@</span>
                  <input type="text" placeholder="seucanal" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
                </div>
              </div>
              <div className={`${styles.tabFooter} ${styles.spaceBetween}`}>
                <button type="button" className={styles.prevBtn} onClick={() => setActiveTab('professional')}>
                  <ChevronLeft size={18} /> Anterior
                </button>
                <button type="submit" disabled={isLoading} style={{ padding: '0.8rem 2rem', background: '#d4af37', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>
                  {isLoading ? 'Salvando...' : 'Salvar Corretor'}
                </button>
              </div>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  )
}
