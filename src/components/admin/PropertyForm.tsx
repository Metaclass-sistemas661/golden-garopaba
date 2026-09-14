"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, UploadCloud, CheckCircle2, Circle, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Palette, Smile, Trash2, Loader2, ChevronRight, ChevronLeft, Search } from 'lucide-react'
import styles from './PropertyForm.module.css'
import { saveProperty } from '@/app/actions/properties'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatCurrencyInput, parseCurrencyToNumber, formatNumberInput } from '@/utils/mask'
import { PropertyDTO } from '@/types/dto'

interface PropertyFormProps {
  initialData?: PropertyDTO;
  isEdit?: boolean;
}

const PROPERTY_CATEGORIES = {
  'RESIDENTIAL': ['Apartamento', 'Casa', 'Cobertura', 'Casa de Condomínio', 'Sobrado', 'Kitnet / Studio / Flat'],
  'COMMERCIAL': ['Sala Comercial', 'Loja', 'Galpão', 'Prédio Comercial', 'Terreno Comercial'],
  'RURAL': ['Sítio / Chácara', 'Fazenda', 'Haras', 'Terreno Rural']
}

const FEATURES = [ 'Condomínio fechado', 'De frente para o mar', 'Mobiliado', 'Semimobiliado', 'Novo', 'Usado', 'Aceita permuta', 'Financiável', 'Elevador' ]
const LEISURE = [ 'Piscina', 'Churrasqueira', 'Salão de festas', 'Salão de jogos', 'Espaço gourmet', 'Varanda gourmet', 'Sala de cinema', 'Deck molhado' ]
const FURNITURE = [ 'Ar condicionado', 'Armário cozinha', 'Armário embutido', 'Móveis planejados' ]
const INFRASTRUCTURE = [ 'Acessibilidade para PNE', 'Acesso asfaltado', 'Adega', 'Antena TV', 'Aquecimento a gás', 'Aquecimento central', 'Aquecimento solar', 'Árvores frutíferas', 'Banheira hidromassagem', 'Bar', 'Cachoeira', 'Canil', 'Caseiro', 'Celeiro', 'Central telefônica', 'Cercas', 'Coletiva seletiva de lixo', 'Copa', 'Cozinha gourmet', 'Cozinha grande', 'Cozinha independente', 'De esquina', 'Deck', 'Depósito', 'Edícula', 'Elevador', 'Energia solar', 'Entrada lateral', 'Escada', 'Espera para split', 'Estacionamento', 'Forno de pizza', 'Gás central', 'Gás individual', 'Hall de entrada', 'Hidrômetro individual', 'Hobby box', 'Home office', 'Internet', 'Jacuzzi', 'Janela grande', 'Jardim', 'Lareira', 'Lareira a gás (espera)', 'Lavanderia', 'Luminárias', 'Muro', 'Pe direito elevado', 'Pet friendly', 'Porão', 'Quintal', 'Recepção', 'Redário', 'Reservatório de água', 'Residência inteligente', 'Sacada', 'Sala de almoço', 'Sótão', 'Telefone', 'Varanda fechada com vidro', 'Varanda integrada', 'Varanda separada', 'Vista panorâmica' ]
const ENVIRONMENTS = [ 'Açude', 'Área de serviço', 'Banheiro auxiliar', 'Banheiro social', 'Closet', 'Cozinha', 'Cozinha americana', 'Dep. empregada', 'Despensa', 'Energia elétrica', 'Escritório', 'Estar social', 'Horta', 'Lago', 'Lavabo', 'Mezanino', 'Nascente', 'Pátio', 'Poço artesiano', 'Pomar', 'Riacho', 'Sala de estar', 'Sala de jantar', 'Terraço', 'Varanda' ]
const SECURITY = [ 'Alarme', 'Circuito TV', 'Fechadura digital', 'Interfone', 'Portão eletrônico', 'Vídeo monitoramento' ]

export default function PropertyForm({ initialData, isEdit = false }: PropertyFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('basic')
  const [isSaving, setIsSaving] = useState(false)
  
  // Basic states
  const [title, setTitle] = useState(initialData?.title || '')
  const [code, setCode] = useState(initialData?.code || '')
  const [transactionType, setTransactionType] = useState(initialData?.transactionType || '')
  const [status, setStatus] = useState(initialData?.status || 'AVAILABLE')
  const [selectedCategory, setSelectedCategory] = useState<'RESIDENTIAL'|'COMMERCIAL'|'RURAL'>(initialData?.category || 'RESIDENTIAL')
  const [selectedType, setSelectedType] = useState<string>(initialData?.propertyType || '')
  const [zipCode, setZipCode] = useState(initialData?.zipCode || '')
  const [street, setStreet] = useState(initialData?.street || '')
  const [addressNumber, setAddressNumber] = useState(initialData?.number || '')
  const [complement, setComplement] = useState(initialData?.complement || '')
  const [neighborhood, setNeighborhood] = useState(initialData?.neighborhood || '')
  const [city, setCity] = useState(initialData?.city || '')
  const [addressState, setAddressState] = useState(initialData?.state || '')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState('')
  const [cepSuccess, setCepSuccess] = useState(false)
  // Field-level validation errors for address (client-side)
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({})
  const [price, setPrice] = useState(initialData?.price ? formatCurrency(Number(initialData.price)) : '')
  const [rentPrice, setRentPrice] = useState(initialData?.rentPrice ? formatCurrency(Number(initialData.rentPrice)) : '')
  const [condoPrice, setCondoPrice] = useState(initialData?.condoPrice ? formatCurrency(Number(initialData.condoPrice)) : '')
  const [iptuPrice, setIptuPrice] = useState(initialData?.iptuPrice ? formatCurrency(Number(initialData.iptuPrice)) : '')
  const [featured, setFeatured] = useState(initialData?.featured || false)
  
  // Coordinates
  const [latitude, setLatitude] = useState(initialData?.latitude?.toString() || '')
  const [longitude, setLongitude] = useState(initialData?.longitude?.toString() || '')
  
  // Tech details
  const [areaTotal, setAreaTotal] = useState(initialData?.areaTotal?.toString() || '')
  const [areaUseful, setAreaUseful] = useState(initialData?.areaUseful?.toString() || '')
  const [bedrooms, setBedrooms] = useState(initialData?.bedrooms?.toString() || '')
  const [suites, setSuites] = useState(initialData?.suites?.toString() || '')
  const [bathrooms, setBathrooms] = useState(initialData?.bathrooms?.toString() || '')
  const [parkingSpaces, setParkingSpaces] = useState(initialData?.parkingSpaces?.toString() || '')

  // Amenities states
  const [features, setFeatures] = useState<string[]>(initialData?.features || [])
  const [leisure, setLeisure] = useState<string[]>(initialData?.leisure || [])
  const [security, setSecurity] = useState<string[]>(initialData?.security || [])
  const [furniture, setFurniture] = useState<string[]>(initialData?.furniture || [])
  const [environments, setEnvironments] = useState<string[]>(initialData?.environments || [])
  const [infrastructure, setInfrastructure] = useState<string[]>(initialData?.infrastructure || [])
  const descriptionRef = useRef(initialData?.description || '')

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, array: string[], item: string) => {
    if (array.includes(item)) setter(array.filter(a => a !== item))
    else setter([...array, item])
  }

  // Photos State
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || [])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Media Links
  const [tourLink, setTourLink] = useState(initialData?.tourLink || '')
  const [videoLink, setVideoLink] = useState(initialData?.videoLink || '')
  const [financeable, setFinanceable] = useState(initialData?.financeable || false)

  // Comandos do Rich Text Editor Nativo
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const EMOJIS = ['🏠', '🏢', '🔑', '🏊‍♂️', '🚗', '🌴', '☀️', '🌊', '🛏️', '🛁', '🛋️', '🍽️', '📐', '🌳', '🥩', '🍷', '🛡️', '📹', '🐾', '✨', '⭐', '💎', '🏆', '📍', '📞']

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) setShowEmojiPicker(false)
    }
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  // ============================================================================
  // CEP Lookup — Enterprise Grade
  // ViaCEP API with: 5s timeout, 3 retries, exponential backoff, graceful fallback
  // ============================================================================
  const lookupCEP = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) {
      setCepError('CEP deve ter 8 dígitos')
      setCepSuccess(false)
      return
    }

    setCepLoading(true)
    setCepError('')
    setCepSuccess(false)

    const MAX_RETRIES = 3
    const TIMEOUT_MS  = 5000

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // AbortController garante timeout de 5s por tentativa
        const controller = new AbortController()
        const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS)

        const response = await fetch(
          `https://viacep.com.br/ws/${cleanCep}/json/`,
          { signal: controller.signal }
        )
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        // ViaCEP retorna { erro: true } para CEPs inexistentes
        if (data.erro) {
          setCepError('CEP não encontrado. Preencha o endereço manualmente.')
          setCepSuccess(false)
          setCepLoading(false)
          return
        }

        // Preenche os campos automaticamente com os dados retornados
        // Só sobrescreve se o ViaCEP retornou valor (preserva edição manual)
        if (data.logradouro) setStreet(data.logradouro)
        if (data.bairro)     setNeighborhood(data.bairro)
        if (data.localidade) setCity(data.localidade)
        if (data.uf)         setAddressState(data.uf)

        setCepSuccess(true)
        setCepError('')
        setCepLoading(false)

        // Foca no campo Número após auto-preenchimento para agilizar o fluxo
        setTimeout(() => {
          const numberInput = document.getElementById('addressNumber')
          if (numberInput) (numberInput as HTMLInputElement).focus()
        }, 150)

        return // sucesso — sai do loop de retries

      } catch (err: unknown) {
        const isAbort  = err instanceof Error && err.name === 'AbortError'
        const isLast   = attempt === MAX_RETRIES

        if (isLast) {
          // Esgotou todas as tentativas — modo de fallback gracioso
          const reason = isAbort
            ? 'Tempo de resposta excedido (5s)'
            : 'Serviço indisponível no momento'

          setCepError(
            `${reason}. Preencha o endereço manualmente — o imóvel será salvo normalmente.`
          )
          setCepSuccess(false)
          setCepLoading(false)
          console.warn(`[CEP] Falhou após ${MAX_RETRIES} tentativas para CEP ${cleanCep}:`, err)
          return
        }

        // Exponential backoff antes de retry: 500ms, 1000ms, 2000ms
        const backoffMs = 500 * Math.pow(2, attempt - 1)
        console.warn(`[CEP] Tentativa ${attempt} falhou. Retry em ${backoffMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
      }
    }
  }

  // Formata CEP enquanto digita (XXXXX-XXX) e dispara lookup automático
  const handleCepChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 8)
    const formattedValue = cleanValue.length > 5
      ? `${cleanValue.slice(0, 5)}-${cleanValue.slice(5)}`
      : cleanValue
    setZipCode(formattedValue)
    setCepError('')
    setCepSuccess(false)
    // Auto-lookup ao completar 8 dígitos
    if (cleanValue.length === 8) {
      lookupCEP(cleanValue)
    }
  }

  // Monta a string de endereço completo para geocoding (backward-compatible)
  const composeLocation = () => {
    const parts: string[] = []
    if (street)        parts.push(street)
    if (addressNumber) parts.push(addressNumber)
    if (complement)    parts.push(complement)
    if (neighborhood)  parts.push(`- ${neighborhood}`)
    if (city && addressState) parts.push(`${city} - ${addressState}`)
    else if (city)     parts.push(city)
    if (zipCode)       parts.push(zipCode.replace(/\D/g, ''))
    return parts.join(', ').replace(', -', ' -')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    setUploadingFiles(true)
    const supabase = createClient()
    const newPhotos = [...photos]

    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `imoveis/${fileName}`

      const { data, error } = await supabase.storage.from('properties').upload(filePath, file)
      if (error) {
        console.error('Upload error', error)
        alert('Erro ao fazer upload da imagem: ' + file.name)
      } else if (data) {
        const { data: publicUrlData } = supabase.storage.from('properties').getPublicUrl(filePath)
        newPhotos.push(publicUrlData.publicUrl)
      }
    }
    
    setPhotos(newPhotos)
    setUploadingFiles(false)
  }

  const removePhoto = (urlToRemove: string) => {
    setPhotos(photos.filter(url => url !== urlToRemove))
  }

  // Form Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // ── Client-Side Address Validation ────────────────────────────────────────
    // Validates before sending to server. Highlights invalid fields inline.
    const newErrors: Record<string, string> = {}

    // Cidade é obrigatória para garantir qualidade do geocoding
    if (!city.trim()) {
      newErrors.city = 'Cidade é obrigatória para localização no mapa'
    }

    // Se CEP foi preenchido, deve ter 8 dígitos
    const cleanZip = zipCode.replace(/\D/g, '')
    if (cleanZip.length > 0 && cleanZip.length !== 8) {
      newErrors.zipCode = 'CEP deve ter 8 dígitos (formato: XXXXX-XXX)'
    }

    // Se estado foi preenchido, deve ser UF válida
    const VALID_UF = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
    if (addressState && !VALID_UF.includes(addressState.toUpperCase())) {
      newErrors.state = 'Selecione um estado válido'
    }

    if (Object.keys(newErrors).length > 0) {
      setAddressErrors(newErrors)
      setIsSaving(false)
      // Navega para a aba básica e faz scroll até o bloco de endereço
      setActiveTab('basic')
      setTimeout(() => {
        document.getElementById('addressBlock')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return
    }

    setAddressErrors({})
    setIsSaving(true)

    const descElement = document.getElementById('richTextDescription')
    if (descElement) {
      descriptionRef.current = descElement.innerHTML
    }

    const payload = {
      title, code, transactionType, category: selectedCategory, propertyType: selectedType,
      location: composeLocation(), description: descriptionRef.current,
      street: street || null,
      number: addressNumber || null,
      complement: complement || null,
      neighborhood: neighborhood || null,
      city: city || null,
      state: addressState || null,
      zipCode: cleanZip || null,
      price: parseCurrencyToNumber(price), 
      rentPrice: parseCurrencyToNumber(rentPrice), 
      condoPrice: parseCurrencyToNumber(condoPrice), 
      iptuPrice: parseCurrencyToNumber(iptuPrice), 
      areaTotal: areaTotal ? Number(areaTotal) : null, 
      areaUseful: areaUseful ? Number(areaUseful) : null, 
      bedrooms: bedrooms ? Number(bedrooms) : 0, 
      suites: suites ? Number(suites) : 0, 
      bathrooms: bathrooms ? Number(bathrooms) : 0, 
      parkingSpaces: parkingSpaces ? Number(parkingSpaces) : 0,
      features, leisure, security, furniture, environments, infrastructure, photos, tourLink, videoLink, financeable, featured, status,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined
    }

    const res = await saveProperty(payload, isEdit, initialData?.id)
    
    if (res.success) {
      router.push('/painel/imoveis')
    } else {
      alert('Erro ao salvar o imóvel: ' + res.error)
      setIsSaving(false)
    }
  }

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value)
  }

  const renderCheckboxGrid = (list: string[], selectedArray: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => (
    <div className={styles.checkboxGrid}>
      {list.map(item => (
        <div key={item} className={`${styles.checkboxLabel} ${selectedArray.includes(item) ? styles.checked : ''}`} onClick={() => toggleArrayItem(setter, selectedArray, item)}>
          <div className={styles.checkIcon}>
            {selectedArray.includes(item) ? <CheckCircle2 size={18} color="var(--color-primary)" /> : <Circle size={18} color="#cbd5e1" />}
          </div>
          <span>{item}</span>
        </div>
      ))}
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.titleArea}>
          <h1>{isEdit ? 'Editar Imóvel' : 'Novo Imóvel'}</h1>
          <p>{isEdit ? 'Atualize os dados do seu anúncio.' : 'Preencha os dados do novo anúncio passo a passo.'}</p>
        </div>
      </div>

      <div className={styles.formLayout}>
        <aside className={styles.formNav}>
          <button className={`${styles.navItem} ${activeTab === 'basic' ? styles.active : ''}`} onClick={() => setActiveTab('basic')} type="button">Informações Básicas</button>
          <button className={`${styles.navItem} ${activeTab === 'values' ? styles.active : ''}`} onClick={() => setActiveTab('values')} type="button">Valores e Custos</button>
          <button className={`${styles.navItem} ${activeTab === 'tech' ? styles.active : ''}`} onClick={() => setActiveTab('tech')} type="button">Detalhes Técnicos</button>
          <button className={`${styles.navItem} ${activeTab === 'amenities' ? styles.active : ''}`} onClick={() => setActiveTab('amenities')} type="button">Atributos e Comodidades</button>
          <button className={`${styles.navItem} ${activeTab === 'media' ? styles.active : ''}`} onClick={() => setActiveTab('media')} type="button">Fotos (Upload Real)</button>
        </aside>

        <form id="propertyForm" className={styles.formContent} onSubmit={handleSave}>
          {activeTab === 'basic' && (
            <div className={styles.tabContent}>
              <h2>Informações Principais</h2>
              
              <div className={styles.formGroup}>
                <label>Título do Imóvel</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Mansão Suspensa Frente Mar" required />
              </div>
              
              <div className={styles.grid3}>
                <div className={styles.formGroup}>
                  <label>Código de Referência (REF)</label>
                  <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Ex: REF-105" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Transação Principal</label>
                  <select value={transactionType} onChange={e => setTransactionType(e.target.value)} required>
                    <option value="">Selecione...</option>
                    <option value="SALE">Venda</option>
                    <option value="RENT">Aluguel</option>
                    <option value="LANCAMENTO">Lançamento</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Disponibilidade (Status)</label>
                  <select value={status} onChange={e => setStatus(e.target.value as 'AVAILABLE' | 'SOLD' | 'RENTED')} required style={{ fontWeight: 'bold', color: status === 'AVAILABLE' ? '#10b981' : '#f59e0b' }}>
                    <option value="AVAILABLE">Disponível</option>
                    <option value="SOLD">Vendido</option>
                    <option value="RENTED">Alugado</option>
                  </select>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Categoria Global</label>
                  <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value as 'RESIDENTIAL' | 'COMMERCIAL' | 'RURAL'); setSelectedType('') }} required>
                    <option value="RESIDENTIAL">Residencial</option>
                    <option value="COMMERCIAL">Comercial</option>
                    <option value="RURAL">Rural</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Tipo Específico</label>
                  <select value={selectedType} onChange={e => setSelectedType(e.target.value)} required>
                    <option value="">Selecione...</option>
                    {PROPERTY_CATEGORIES[selectedCategory as keyof typeof PROPERTY_CATEGORIES]?.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>

              {/* ── Structured Address Block – Part 1 ── */}
              <div id="addressBlock" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1rem', color: '#10b981' }}>📍</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Endereço do Imóvel</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '0.25rem' }}>— Coordenadas GPS obtidas automaticamente</span>
                </div>
                {/* CEP row */}
                <div className={styles.grid2} style={{ alignItems: 'flex-start' }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label>CEP <span style={{ color: '#94a3b8', fontWeight: 400 }}>(auto-preenchimento)</span></label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={e => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        style={{ flex: 1, borderColor: addressErrors.zipCode ? '#ef4444' : undefined }}
                        onFocus={() => setAddressErrors(prev => { const n = {...prev}; delete n.zipCode; return n })}
                      />
                      <button type="button" onClick={() => lookupCEP(zipCode)} disabled={cepLoading || zipCode.replace(/\D/g, '').length !== 8}
                        style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '0 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', opacity: (cepLoading || zipCode.replace(/\D/g, '').length !== 8) ? 0.5 : 1, transition: '0.2s' }}>
                        {cepLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
                        {cepLoading ? 'Buscando...' : 'Buscar'}
                      </button>
                    </div>
                    {addressErrors.zipCode && <small style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>✗ {addressErrors.zipCode}</small>}
                    {!addressErrors.zipCode && cepError && <small style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>✗ {cepError}</small>}
                    {cepSuccess && <small style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>✓ Endereço encontrado e preenchido automaticamente</small>}
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label>Estado (UF)</label>
                    <select
                      value={addressState}
                      onChange={e => { setAddressState(e.target.value); setAddressErrors(prev => { const n = {...prev}; delete n.state; return n }) }}
                      style={{ borderColor: addressErrors.state ? '#ef4444' : undefined }}
                    >
                      <option value="">Selecione...</option>
                      {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                    {addressErrors.state && <small style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>✗ {addressErrors.state}</small>}
                  </div>
                </div>
                {/* Street + Number row */}
                <div className={styles.grid2} style={{ alignItems: 'flex-start' }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label>Logradouro / Rua</label>
                    <input type="text" value={street} onChange={e => setStreet(e.target.value)} placeholder="Ex: Rua das Flores" />
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label>Número</label>
                    <input id="addressNumber" type="text" value={addressNumber} onChange={e => setAddressNumber(e.target.value)} placeholder="Ex: 123 ou S/N" />
                  </div>
                </div>
                {/* Complement + Neighborhood row */}
                <div className={styles.grid2} style={{ alignItems: 'flex-start' }}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label>Complemento <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
                    <input type="text" value={complement} onChange={e => setComplement(e.target.value)} placeholder="Ex: Apto 42, Bloco B" />
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label>Bairro</label>
                    <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Ex: Centro" />
                  </div>
                </div>
                {/* City — required */}
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label>
                    Cidade <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '0.25rem' }}>(obrigatório para localização no mapa)</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => { setCity(e.target.value); setAddressErrors(prev => { const n = {...prev}; delete n.city; return n }) }}
                    placeholder="Ex: Garopaba"
                    style={{ borderColor: addressErrors.city ? '#ef4444' : undefined }}
                  />
                  {addressErrors.city && <small style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>✗ {addressErrors.city}</small>}
                </div>
                {/* Address preview */}
                {(street || city || neighborhood) && (
                  <div style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: '8px', padding: '0.65rem 0.9rem', fontSize: '0.82rem', color: '#065f46', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <span style={{ flexShrink: 0 }}>📋</span>
                    <span><strong>Endereço completo:</strong> {composeLocation() || '—'}</span>
                  </div>
                )}
                {/* Manual Coordinates Override */}
                <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#3b82f6' }}>⚙️</span>
                    <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Ajuste Manual de Coordenadas (Opcional)</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    Se deixado em branco, o sistema tentará buscar as coordenadas automaticamente pelo endereço. Preencha apenas se quiser forçar uma localização exata.
                  </p>
                  <div className={styles.grid2} style={{ alignItems: 'flex-start' }}>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label>Latitude</label>
                      <input type="text" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="Ex: -28.0275" />
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label>Longitude</label>
                      <input type="text" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="Ex: -48.6178" />
                    </div>
                  </div>
                </div>
              </div>


              <div className={styles.formGroup} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Imóvel em Destaque</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Exibir este imóvel na seção de destaques da página inicial.</p>
                </div>
                <button type="button" onClick={() => setFeatured(!featured)} style={{ background: featured ? '#10b981' : '#cbd5e1', width: '48px', height: '24px', borderRadius: '12px', position: 'relative', transition: '0.2s', border: 'none', cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', top: '2px', left: featured ? '26px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: '0.2s' }} />
                </button>
              </div>

              <div className={styles.formGroup}>
                <label>Descrição Profissional do Imóvel</label>
                <div className={styles.richTextEditor}>
                  <div className={styles.editorToolbar}>
                    <div className={styles.toolbarGroup}>
                      <button type="button" className={styles.toolbarBtn} onClick={() => executeCommand('bold')}><Bold size={16} /></button>
                      <button type="button" className={styles.toolbarBtn} onClick={() => executeCommand('italic')}><Italic size={16} /></button>
                      <button type="button" className={styles.toolbarBtn} onClick={() => executeCommand('underline')}><Underline size={16} /></button>
                    </div>
                    <div className={styles.toolbarDivider}></div>
                    <div className={styles.toolbarGroup}>
                      <button type="button" className={styles.toolbarBtn} onClick={() => executeCommand('justifyLeft')}><AlignLeft size={16} /></button>
                      <button type="button" className={styles.toolbarBtn} onClick={() => executeCommand('justifyCenter')}><AlignCenter size={16} /></button>
                      <button type="button" className={styles.toolbarBtn} onClick={() => executeCommand('justifyRight')}><AlignRight size={16} /></button>
                    </div>
                    <div className={styles.toolbarDivider}></div>
                    <div className={styles.toolbarGroup}>
                      <button type="button" className={styles.toolbarBtn} onClick={() => executeCommand('insertUnorderedList')}><List size={16} /></button>
                      <button type="button" className={styles.toolbarBtn} onClick={() => executeCommand('insertOrderedList')}><ListOrdered size={16} /></button>
                    </div>
                    <div className={styles.toolbarDivider}></div>
                    <div className={styles.toolbarGroup}>
                      <div className={styles.colorPickerWrapper}>
                        <button type="button" className={styles.toolbarBtn} title="Cor do Texto"><Palette size={16} /></button>
                        <input type="color" className={styles.colorInput} onChange={(e) => executeCommand('foreColor', e.target.value)} title="Escolher Cor" />
                      </div>
                      <div className={styles.emojiPickerWrapper} ref={emojiPickerRef}>
                        <button type="button" className={styles.toolbarBtn} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                          <Smile size={16} />
                        </button>
                        {showEmojiPicker && (
                          <div className={styles.emojiDropdown} data-lenis-prevent="true">
                            <div className={styles.emojiGrid}>
                              {EMOJIS.map(emoji => (
                                <button key={emoji} type="button" className={styles.emojiBtn} onClick={() => { executeCommand('insertText', emoji); setShowEmojiPicker(false); }}>
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button type="button" className={styles.toolbarBtn} title="Limpar Formatação" onClick={() => executeCommand('removeFormat')}>Remover Cor/Formato</button>
                    </div>
                  </div>
                  <div 
                    id="richTextDescription"
                    className={styles.editorTextarea}
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    dangerouslySetInnerHTML={{ __html: initialData?.description || '' }}
                    onInput={(e) => { descriptionRef.current = e.currentTarget.innerHTML }}
                  ></div>
                </div>
              </div>
              <div className={styles.tabFooter}>
                <button type="button" className={styles.nextBtn} onClick={() => setActiveTab('values')}>
                  Avançar <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'values' && (
            <div className={styles.tabContent}>
              <h2>Valores e Custos</h2>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Valor de Venda (R$)</label>
                  <input type="text" value={price} onChange={e => setPrice(formatCurrencyInput(e.target.value))} placeholder="Ex: 2.500.000,00" />
                </div>
                <div className={styles.formGroup}>
                  <label>Valor de Aluguel Mensal (R$)</label>
                  <input type="text" value={rentPrice} onChange={e => setRentPrice(formatCurrencyInput(e.target.value))} placeholder="Ex: 8.500,00" />
                </div>
              </div>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Valor do Condominio (R$)</label>
                  <input type="text" value={condoPrice} onChange={e => setCondoPrice(formatCurrencyInput(e.target.value))} placeholder="Ex: 850,00" />
                </div>
                <div className={styles.formGroup}>
                  <label>Valor do IPTU Anual (R$)</label>
                  <input type="text" value={iptuPrice} onChange={e => setIptuPrice(formatCurrencyInput(e.target.value))} placeholder="Ex: 3.500,00" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Financiamento</label>
                <div
                  className={`${styles.toggleSwitch} ${financeable ? styles.toggleActive : ''}`}
                  onClick={() => setFinanceable(!financeable)}
                  role="switch"
                  aria-checked={financeable}
                >
                  <div className={styles.toggleTrack}>
                    <div className={styles.toggleThumb} />
                  </div>
                  <span>{financeable ? 'Financiavel' : 'Nao financiavel'}</span>
                </div>
              </div>
              <div className={`${styles.tabFooter} ${styles.spaceBetween}`}>
                <button type="button" className={styles.prevBtn} onClick={() => setActiveTab('basic')}>
                  <ChevronLeft size={18} /> Anterior
                </button>
                <button type="button" className={styles.nextBtn} onClick={() => setActiveTab('tech')}>
                  Avançar <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tech' && (
            <div className={styles.tabContent}>
              <h2>Detalhes Técnicos</h2>
              <div className={styles.grid3}>
                <div className={styles.formGroup}>
                  <label>Área Total (m²)</label>
                  <input type="text" value={areaTotal} onChange={e => setAreaTotal(formatNumberInput(e.target.value))} />
                </div>
                <div className={styles.formGroup}>
                  <label>Área Útil (m²)</label>
                  <input type="text" value={areaUseful} onChange={e => setAreaUseful(formatNumberInput(e.target.value))} />
                </div>
                <div className={styles.formGroup}>
                  <label>Quartos</label>
                  <input type="text" value={bedrooms} onChange={e => setBedrooms(formatNumberInput(e.target.value))} />
                </div>
                <div className={styles.formGroup}>
                  <label>Suítes</label>
                  <input type="text" value={suites} onChange={e => setSuites(formatNumberInput(e.target.value))} />
                </div>
                <div className={styles.formGroup}>
                  <label>Banheiros</label>
                  <input type="text" value={bathrooms} onChange={e => setBathrooms(formatNumberInput(e.target.value))} />
                </div>
                <div className={styles.formGroup}>
                  <label>Vagas de Garagem</label>
                  <input type="text" value={parkingSpaces} onChange={e => setParkingSpaces(formatNumberInput(e.target.value))} />
                </div>
              </div>
              <div className={`${styles.tabFooter} ${styles.spaceBetween}`}>
                <button type="button" className={styles.prevBtn} onClick={() => setActiveTab('values')}>
                  <ChevronLeft size={18} /> Anterior
                </button>
                <button type="button" className={styles.nextBtn} onClick={() => setActiveTab('amenities')}>
                  Avançar <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'amenities' && (
            <div className={styles.tabContent}>
              <h2>Atributos e Comodidades</h2>
              
              <div className={styles.attributeSection}>
                <h3>Características Gerais</h3>
                {renderCheckboxGrid(FEATURES, features, setFeatures)}
              </div>
              <div className={styles.attributeSection}>
                <h3>Lazer</h3>
                {renderCheckboxGrid(LEISURE, leisure, setLeisure)}
              </div>
              <div className={styles.attributeSection}>
                <h3>Segurança</h3>
                {renderCheckboxGrid(SECURITY, security, setSecurity)}
              </div>
              <div className={styles.attributeSection}>
                <h3>Mobílias</h3>
                {renderCheckboxGrid(FURNITURE, furniture, setFurniture)}
              </div>
              <div className={styles.attributeSection}>
                <h3>Ambientes</h3>
                {renderCheckboxGrid(ENVIRONMENTS, environments, setEnvironments)}
              </div>
              <div className={styles.attributeSection}>
                <h3>Infraestrutura e Serviços</h3>
                {renderCheckboxGrid(INFRASTRUCTURE, infrastructure, setInfrastructure)}
              </div>
              <div className={`${styles.tabFooter} ${styles.spaceBetween}`}>
                <button type="button" className={styles.prevBtn} onClick={() => setActiveTab('tech')}>
                  <ChevronLeft size={18} /> Anterior
                </button>
                <button type="button" className={styles.nextBtn} onClick={() => setActiveTab('media')}>
                  Avançar <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className={styles.tabContent}>
              <h2>Galeria de Fotos (Supabase Storage)</h2>
              
              <div className={styles.formGroup}>
                <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                  {uploadingFiles ? <Loader2 size={48} className={styles.spin} /> : <UploadCloud size={48} className={styles.uploadIcon} />}
                  <p>{uploadingFiles ? 'Enviando arquivos (Aguarde...)' : 'Clique para selecionar fotos e enviar para a Nuvem'}</p>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {photos.length > 0 && (
                <div className={styles.photoPreviewGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                  {photos.map((url: string, idx: number) => (
                    <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <Image src={url} alt={`Foto ${idx}`} fill unoptimized style={{ objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => removePhoto(url)} 
                        style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <hr className={styles.divider} style={{ margin: '3rem 0' }} />
              <h3>Imersão e Experiência Digital</h3>
              <p className={styles.helpText}>Destaque seu imóvel utilizando links de vídeos ou tours virtuais para atrair clientes de longe.</p>
              
              <div className={styles.formGroup}>
                <label>Link do Tour Virtual 3D (Matterport, Kuula, etc)</label>
                <input type="url" value={tourLink} onChange={e => setTourLink(e.target.value)} placeholder="https://my.matterport.com/show/?m=..." />
              </div>
              <div className={styles.formGroup}>
                <label>Link do Vídeo Institucional / Drone (YouTube ou Vimeo)</label>
                <input type="url" value={videoLink} onChange={e => setVideoLink(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div className={`${styles.tabFooter} ${styles.spaceBetween}`}>
                <button type="button" className={styles.prevBtn} onClick={() => setActiveTab('amenities')}>
                  <ChevronLeft size={18} /> Anterior
                </button>
                <button type="submit" disabled={isSaving} style={{ padding: '0.8rem 2rem', background: '#d4af37', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>
                  {isSaving ? 'Salvando...' : 'Salvar Imóvel'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
