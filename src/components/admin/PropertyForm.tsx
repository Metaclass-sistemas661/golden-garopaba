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
import { processUploadFile, prepareWatermark, ACCEPTED_FILE_TYPES, type Watermark } from '@/utils/imageProcessing'
import { getSettings } from '@/app/actions/settings'

interface PropertyFormProps {
  initialData?: PropertyDTO;
  isEdit?: boolean;
}

const PROPERTY_CATEGORIES = {
  'RESIDENTIAL': ['Apartamento', 'Casa', 'Cobertura', 'Casa de Condomínio', 'Sobrado', 'Kitnet / Studio / Flat', 'Terreno'],
  'COMMERCIAL': ['Sala Comercial', 'Loja', 'Galpão', 'Prédio Comercial', 'Terreno Comercial'],
  'RURAL': ['Sítio', 'Chácara', 'Fazenda', 'Haras', 'Terreno Rural']
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

  // Marca d'água — LOGO da imobiliária (sem fundo), com fallback para o nome em texto
  const [watermarkText, setWatermarkText] = useState<string | null>(null)
  const [watermarkLogo, setWatermarkLogo] = useState<Watermark | null>(null)
  const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null)
  const [watermarkEnabled, setWatermarkEnabled] = useState(true)
  const [watermarkStatus, setWatermarkStatus] = useState<'loading' | 'ready' | 'missing'>('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const s = await getSettings()
        if (cancelled) return
        const name = s?.companyName?.trim() ?? ''
        const isDefaultName = name === '' || name.toLowerCase() === 'minha imobiliária'
        if (!isDefaultName) setWatermarkText(name)

        const logoUrl = s?.logoUrl?.trim()
        if (logoUrl) {
          try {
            const wm = await prepareWatermark(logoUrl)
            if (cancelled) return
            setWatermarkLogo(wm)
            setWatermarkPreview(wm.image.toDataURL('image/png'))
            setWatermarkStatus('ready')
            return
          } catch (err) {
            console.warn('[Watermark] Falha ao carregar logo, usando texto:', err)
          }
        }
        if (!cancelled) setWatermarkStatus(isDefaultName ? 'missing' : 'ready')
      } catch {
        if (!cancelled) setWatermarkStatus('missing')
      }
    })()
    return () => { cancelled = true }
  }, [])
  
  // Media Links
  const [tourLink, setTourLink] = useState(initialData?.tourLink || '')
  const [videoLink, setVideoLink] = useState(initialData?.videoLink || '')
  const [financeable, setFinanceable] = useState(initialData?.financeable || false)

  // ============================================================================
  // Rascunho automático (localStorage)
  // Garante que NENHUM dado digitado seja perdido em caso de erro, recarga da
  // página, queda de conexão ou crash de renderização.
  // ============================================================================
  const DRAFT_KEY = `property-draft:${isEdit && initialData?.id ? initialData.id : 'new'}`
  const [draftRestored, setDraftRestored] = useState(false)
  const draftReadyRef = useRef(false)

  const buildDraft = () => ({
    v: 1, savedAt: Date.now(),
    title, code, transactionType, status, selectedCategory, selectedType,
    zipCode, street, addressNumber, complement, neighborhood, city, addressState,
    price, rentPrice, condoPrice, iptuPrice, featured, latitude, longitude,
    areaTotal, areaUseful, bedrooms, suites, bathrooms, parkingSpaces,
    features, leisure, security, furniture, environments, infrastructure,
    photos, tourLink, videoLink, financeable, description: descriptionRef.current,
  })

  // Restaura rascunho uma única vez, após montar (evita mismatch de hidratação e cascading render síncrono)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) {
          const d = JSON.parse(raw)
          if (d && d.v === 1) {
            const s = (v: unknown, fb: string) => (typeof v === 'string' ? v : fb)
            const a = (v: unknown, fb: string[]) => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : fb)
            setTitle(s(d.title, title)); setCode(s(d.code, code))
            setTransactionType(s(d.transactionType, transactionType))
            if (['AVAILABLE','SOLD','RENTED'].includes(d.status)) setStatus(d.status)
            if (['RESIDENTIAL','COMMERCIAL','RURAL'].includes(d.selectedCategory)) setSelectedCategory(d.selectedCategory)
            setSelectedType(s(d.selectedType, selectedType))
            setZipCode(s(d.zipCode, zipCode)); setStreet(s(d.street, street))
            setAddressNumber(s(d.addressNumber, addressNumber)); setComplement(s(d.complement, complement))
            setNeighborhood(s(d.neighborhood, neighborhood)); setCity(s(d.city, city))
            setAddressState(s(d.addressState, addressState))
            setPrice(s(d.price, price)); setRentPrice(s(d.rentPrice, rentPrice))
            setCondoPrice(s(d.condoPrice, condoPrice)); setIptuPrice(s(d.iptuPrice, iptuPrice))
            setFeatured(!!d.featured); setFinanceable(!!d.financeable)
            setLatitude(s(d.latitude, latitude)); setLongitude(s(d.longitude, longitude))
            setAreaTotal(s(d.areaTotal, areaTotal)); setAreaUseful(s(d.areaUseful, areaUseful))
            setBedrooms(s(d.bedrooms, bedrooms)); setSuites(s(d.suites, suites))
            setBathrooms(s(d.bathrooms, bathrooms)); setParkingSpaces(s(d.parkingSpaces, parkingSpaces))
            setFeatures(a(d.features, features)); setLeisure(a(d.leisure, leisure))
            setSecurity(a(d.security, security)); setFurniture(a(d.furniture, furniture))
            setEnvironments(a(d.environments, environments)); setInfrastructure(a(d.infrastructure, infrastructure))
            setPhotos(a(d.photos, photos))
            setTourLink(s(d.tourLink, tourLink)); setVideoLink(s(d.videoLink, videoLink))
            if (typeof d.description === 'string') {
              descriptionRef.current = d.description
              const el = document.getElementById('richTextDescription')
              if (el) el.innerHTML = d.description
            }
            setDraftRestored(true)
          }
        }
      } catch (err) {
        console.warn('[Draft] Falha ao restaurar rascunho:', err)
      } finally {
        draftReadyRef.current = true
      }
    }, 0)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Salva rascunho com debounce a cada alteração
  useEffect(() => {
    if (!draftReadyRef.current) return
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraft())) } catch { /* quota/privado */ }
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, code, transactionType, status, selectedCategory, selectedType, zipCode, street, addressNumber, complement, neighborhood, city, addressState, price, rentPrice, condoPrice, iptuPrice, featured, latitude, longitude, areaTotal, areaUseful, bedrooms, suites, bathrooms, parkingSpaces, features, leisure, security, furniture, environments, infrastructure, photos, tourLink, videoLink, financeable])

  // Salva imediatamente ao sair/recarregar a página (inclui descrição)
  useEffect(() => {
    const flush = () => {
      if (!draftReadyRef.current) return
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraft())) } catch { /* ignore */ }
    }
    window.addEventListener('beforeunload', flush)
    window.addEventListener('pagehide', flush)
    return () => { window.removeEventListener('beforeunload', flush); window.removeEventListener('pagehide', flush) }
  })

  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ } }

  const discardDraft = () => {
    if (!confirm('Descartar o rascunho e recarregar os dados originais?')) return
    clearDraft()
    draftReadyRef.current = false
    window.location.reload()
  }

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
  // - Provedores: ViaCEP (primário) + BrasilAPI (fallback)
  // - Timeout por tentativa, retries com backoff
  // - Proteção contra race condition (só a última busca aplica resultado)
  // - Proteção contra componente desmontado
  // - NUNCA lança exceção: qualquer falha vira mensagem inline
  // ============================================================================
  const cepRequestIdRef = useRef(0)
  const lastLookedUpCepRef = useRef<string>('')
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  type CepResult = { street?: string; neighborhood?: string; city?: string; state?: string } | 'NOT_FOUND'

  const fetchWithTimeout = async (url: string, ms: number) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), ms)
    try {
      return await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' })
    } finally {
      clearTimeout(id)
    }
  }

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

  const CEP_PROVIDERS: Array<(cep: string) => Promise<CepResult>> = [
    async (cep) => {
      const r = await fetchWithTimeout(`https://viacep.com.br/ws/${cep}/json/`, 5000)
      if (r.status === 400) return 'NOT_FOUND'
      if (!r.ok) throw new Error(`ViaCEP HTTP ${r.status}`)
      const d = await r.json().catch(() => null)
      if (!d || typeof d !== 'object') throw new Error('ViaCEP resposta inválida')
      if (d.erro) return 'NOT_FOUND'
      return { street: str(d.logradouro), neighborhood: str(d.bairro), city: str(d.localidade), state: str(d.uf).toUpperCase() }
    },
    async (cep) => {
      const r = await fetchWithTimeout(`https://brasilapi.com.br/api/cep/v1/${cep}`, 6000)
      if (r.status === 404) return 'NOT_FOUND'
      if (!r.ok) throw new Error(`BrasilAPI HTTP ${r.status}`)
      const d = await r.json().catch(() => null)
      if (!d || typeof d !== 'object') throw new Error('BrasilAPI resposta inválida')
      return { street: str(d.street), neighborhood: str(d.neighborhood), city: str(d.city), state: str(d.state).toUpperCase() }
    },
  ]

  const lookupCEP = async (cep: string, opts: { force?: boolean } = {}) => {
    try {
      const cleanCep = String(cep || '').replace(/\D/g, '')
      if (cleanCep.length !== 8) {
        setCepError('CEP deve ter 8 dígitos')
        setCepSuccess(false)
        return
      }
      // Evita buscas duplicadas do mesmo CEP (digitação + clique)
      if (!opts.force && cleanCep === lastLookedUpCepRef.current && cepLoading) return
      lastLookedUpCepRef.current = cleanCep

      const requestId = ++cepRequestIdRef.current
      const isCurrent = () => mountedRef.current && requestId === cepRequestIdRef.current

      setCepLoading(true)
      setCepError('')
      setCepSuccess(false)

      let notFoundVotes = 0
      let lastErr: unknown = null

      for (const provider of CEP_PROVIDERS) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          if (!isCurrent()) return
          try {
            const result = await provider(cleanCep)
            if (!isCurrent()) return
            if (result === 'NOT_FOUND') { notFoundVotes++; break } // tenta próximo provedor

            // Preenche só campos retornados (preserva edição manual)
            if (result.street)       setStreet(result.street)
            if (result.neighborhood) setNeighborhood(result.neighborhood)
            if (result.city)         { setCity(result.city); setAddressErrors(prev => { const n = { ...prev }; delete n.city; return n }) }
            if (result.state && /^[A-Z]{2}$/.test(result.state)) setAddressState(result.state)

            setCepSuccess(true)
            setCepError('')
            setCepLoading(false)
            setTimeout(() => {
              if (!mountedRef.current) return
              const numberInput = document.getElementById('addressNumber') as HTMLInputElement | null
              numberInput?.focus()
            }, 150)
            return
          } catch (err) {
            lastErr = err
            if (attempt < 2) await new Promise(r => setTimeout(r, 400 * attempt))
          }
        }
      }

      if (!isCurrent()) return
      setCepSuccess(false)
      setCepLoading(false)
      if (notFoundVotes > 0 && !lastErr) {
        setCepError('CEP não encontrado. Preencha o endereço manualmente.')
      } else if (notFoundVotes > 0) {
        setCepError('CEP não localizado. Confira o número ou preencha o endereço manualmente.')
      } else {
        const isAbort = lastErr instanceof Error && lastErr.name === 'AbortError'
        setCepError(`${isAbort ? 'Tempo de resposta excedido' : 'Serviço de CEP indisponível'}. Preencha o endereço manualmente — o imóvel será salvo normalmente.`)
        console.warn('[CEP] Todos os provedores falharam:', lastErr)
      }
    } catch (fatal) {
      // Rede de segurança final: nunca deixa a exceção derrubar o formulário
      console.error('[CEP] Erro inesperado:', fatal)
      if (mountedRef.current) {
        setCepLoading(false)
        setCepSuccess(false)
        setCepError('Não foi possível buscar o CEP. Preencha o endereço manualmente.')
      }
    }
  }

  // Formata CEP enquanto digita (XXXXX-XXX) e dispara lookup automático
  const handleCepChange = (value: string) => {
    const cleanValue = String(value || '').replace(/\D/g, '').slice(0, 8)
    const formattedValue = cleanValue.length > 5
      ? `${cleanValue.slice(0, 5)}-${cleanValue.slice(5)}`
      : cleanValue
    setZipCode(formattedValue)
    setCepError('')
    setCepSuccess(false)
    if (cleanValue.length === 8) {
      if (cleanValue !== lastLookedUpCepRef.current) void lookupCEP(cleanValue)
    } else {
      lastLookedUpCepRef.current = ''
      cepRequestIdRef.current++ // cancela busca em andamento
      setCepLoading(false)
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
    
    const files = Array.from(e.target.files)
    e.target.value = '' // permite selecionar o mesmo arquivo novamente

    // Logo tem prioridade; texto só é usado se não houver logo
    const wmLogo = watermarkEnabled ? watermarkLogo : null
    const watermarkTextFinal: string | null = watermarkEnabled && !wmLogo ? watermarkText : null
    setUploadingFiles(true)
    const supabase = createClient()
    const newPhotos = [...photos]
    const failures: string[] = []

    for (const file of files) {
      try {
        const images = await processUploadFile(file, { watermark: wmLogo, watermarkText: watermarkTextFinal })
        for (const img of images) {
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${img.ext}`
          const filePath = `imoveis/${fileName}`
          const { error } = await supabase.storage
            .from('properties')
            .upload(filePath, img.blob, { contentType: img.contentType, cacheControl: '31536000' })
          if (error) throw error
          const { data: publicUrlData } = supabase.storage.from('properties').getPublicUrl(filePath)
          newPhotos.push(publicUrlData.publicUrl)
          setPhotos([...newPhotos])
        }
      } catch (err) {
        console.error('Upload error', file.name, err)
        failures.push(`${file.name}: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
      }
    }

    setPhotos(newPhotos)
    setUploadingFiles(false)
    if (failures.length) {
      alert(`Não foi possível enviar ${failures.length} arquivo(s):\n\n• ${failures.join('\n• ')}`)
    }
  }

  const removePhoto = (urlToRemove: string) => {
    setPhotos(photos.filter(url => url !== urlToRemove))
  }

  // Reordenação de fotos (drag & drop + botões)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const movePhoto = (from: number, to: number) => {
    if (from === to || to < 0 || to >= photos.length) return
    const next = [...photos]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setPhotos(next)
  }

  // Form Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // ── Client-Side Address Validation ────────────────────────────────────────
    // Validates before sending to server. Highlights invalid fields inline.
    const newErrors: Record<string, string> = {}

    // Campos obrigatórios — o atributo HTML `required` não funciona em abas
    // que não estão montadas, então validamos aqui explicitamente.
    const missing: string[] = []
    if (!title.trim()) missing.push('Título do Imóvel')
    if (!code.trim()) missing.push('Código de Referência (REF)')
    if (!transactionType) missing.push('Transação Principal')
    if (!selectedType) missing.push('Tipo Específico')
    if (missing.length > 0) {
      setActiveTab('basic')
      alert(`Preencha os campos obrigatórios na aba "Informações Básicas":\n\n• ${missing.join('\n• ')}`)
      return
    }

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

    // Converte "120,5" / "-28,02" / "1.200" com segurança (nunca NaN)
    const toNum = (v: string): number | null => {
      if (!v || !v.trim()) return null
      let s = v.trim().replace(/[^\d,.\-]/g, '')
      if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
      const n = Number(s)
      return Number.isFinite(n) ? n : null
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
      areaTotal: toNum(areaTotal), 
      areaUseful: toNum(areaUseful), 
      bedrooms: toNum(bedrooms) ?? 0, 
      suites: toNum(suites) ?? 0, 
      bathrooms: toNum(bathrooms) ?? 0, 
      parkingSpaces: toNum(parkingSpaces) ?? 0,
      features, leisure, security, furniture, environments, infrastructure, photos, tourLink, videoLink, financeable, featured, status,
      latitude: toNum(latitude),
      longitude: toNum(longitude)
    }

    try {
      const res = await saveProperty(payload, isEdit, initialData?.id)
      if (res.success) {
        clearDraft()
        draftReadyRef.current = false
        router.push('/painel/imoveis')
      } else {
        alert('Erro ao salvar o imóvel: ' + res.error)
        setIsSaving(false)
      }
    } catch (err) {
      console.error(err)
      alert('Erro de comunicação com o servidor. Verifique sua conexão e tente novamente.')
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

        <form
          id="propertyForm"
          className={styles.formContent}
          onSubmit={handleSave}
          translate="no"
          onKeyDown={(e) => {
            // Enter em inputs NUNCA submete o formulário (evita envio acidental)
            const t = e.target as HTMLElement
            if (e.key === 'Enter' && t.tagName === 'INPUT') e.preventDefault()
          }}
        >
          {draftRestored && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
              <span>💾 Rascunho restaurado automaticamente — seus dados não foram perdidos.</span>
              <span style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => setDraftRestored(false)} style={{ background: 'transparent', border: '1px solid #93c5fd', color: '#1e3a8a', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer' }}>OK</button>
                <button type="button" onClick={discardDraft} style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer' }}>Descartar</button>
              </span>
            </div>
          )}
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
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void lookupCEP(zipCode, { force: true }) } }}
                        inputMode="numeric"
                        autoComplete="postal-code"
                        id="zipCode"
                      />
                      <button type="button" id="cepSearchBtn" onClick={() => void lookupCEP(zipCode, { force: true })} disabled={cepLoading || zipCode.replace(/\D/g, '').length !== 8}
                        style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '0 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', opacity: (cepLoading || zipCode.replace(/\D/g, '').length !== 8) ? 0.5 : 1, transition: '0.2s' }}>
                        {/* Nós estáveis: evita crash do React quando tradutores/extensões alteram o DOM */}
                        <span key="cep-icon" style={{ display: 'inline-flex' }}>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', display: cepLoading ? 'inline' : 'none' }} />
                          <Search size={14} style={{ display: cepLoading ? 'none' : 'inline' }} />
                        </span>
                        <span key="cep-label">{cepLoading ? 'Buscando...' : 'Buscar'}</span>
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
                    ref={(el) => {
                      // Restaura o conteúdo mais recente ao (re)montar a aba,
                      // sem sobrescrever enquanto o usuário digita.
                      if (el && el.dataset.hydrated !== 'true') {
                        el.innerHTML = descriptionRef.current || ''
                        el.dataset.hydrated = 'true'
                      }
                    }}
                    onInput={(e) => { descriptionRef.current = e.currentTarget.innerHTML }}
                    onBlur={(e) => { descriptionRef.current = e.currentTarget.innerHTML }}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.9rem 1.1rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid', borderColor: watermarkStatus === 'ready' && watermarkEnabled ? '#a7f3d0' : watermarkStatus === 'missing' ? '#fca5a5' : '#fde68a', background: watermarkStatus === 'ready' && watermarkEnabled ? '#ecfdf5' : watermarkStatus === 'missing' ? '#fef2f2' : '#fffbeb' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>🛡️ Proteção com marca d&apos;água {watermarkLogo ? '(logo da imobiliária)' : 'dourada'}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                      {watermarkStatus === 'loading' && 'Carregando logo da imobiliária...'}
                      {watermarkStatus === 'ready' && (watermarkEnabled
                        ? (watermarkLogo
                            ? 'A logo (sem fundo, translúcida) será gravada no centro de CADA NOVA foto enviada.'
                            : `Sem logo cadastrada — "​${watermarkText}​" será gravado em dourado. Cadastre a logo em Configurações para usá-la.`)
                        : 'Desativada — as próximas fotos serão enviadas SEM proteção.')}
                      {watermarkStatus === 'missing' && 'Cadastre a logo (ou o nome real) da imobiliária em Configurações → Minha Imobiliária.'}
                    </span>
                  </div>
                  {watermarkPreview && (
                    <div title="Prévia da logo usada como marca d'água" style={{ height: 48, padding: '4px 10px', borderRadius: 8, background: 'repeating-conic-gradient(#cbd5e1 0% 25%, #f1f5f9 0% 50%) 50% / 14px 14px', display: 'flex', alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={watermarkPreview} alt="Logo marca d'água" style={{ maxHeight: 40, maxWidth: 160, objectFit: 'contain' }} />
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: watermarkStatus === 'ready' ? 'pointer' : 'not-allowed', opacity: watermarkStatus === 'ready' ? 1 : 0.5, whiteSpace: 'nowrap' }}>
                    <input id="watermarkToggle" type="checkbox" checked={watermarkEnabled && watermarkStatus === 'ready'} disabled={watermarkStatus !== 'ready'} onChange={e => setWatermarkEnabled(e.target.checked)} />
                    Ativar marca d&apos;água
                  </label>
                </div>
                {watermarkStatus === 'ready' && (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                    ⚠️ A marca d’água é gravada nos pixels apenas nas fotos recém-enviadas. Fotos já existentes precisam do script de migração: <code>npx tsx scripts/watermark-existing-photos.ts --apply</code>
                  </p>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                  {uploadingFiles ? <Loader2 size={48} className={styles.spin} /> : <UploadCloud size={48} className={styles.uploadIcon} />}
                  <p>{uploadingFiles ? 'Enviando arquivos (Aguarde...)' : 'Clique para selecionar fotos e enviar para a Nuvem'}</p>
                  <input 
                    type="file" 
                    multiple 
                    accept={ACCEPTED_FILE_TYPES}
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {photos.length > 1 && (
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '1rem' }}>💡 Arraste as fotos para reordenar. A primeira foto é a capa do anúncio.</p>
              )}
              {photos.length > 0 && (
                <div className={styles.photoPreviewGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  {photos.map((url: string, idx: number) => (
                    <div
                      key={url}
                      draggable
                      onDragStart={(e) => { setDragIndex(idx); e.dataTransfer.effectAllowed = 'move' }}
                      onDragOver={(e) => { e.preventDefault(); if (dragOverIndex !== idx) setDragOverIndex(idx) }}
                      onDragLeave={() => setDragOverIndex(null)}
                      onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) movePhoto(dragIndex, idx); setDragIndex(null); setDragOverIndex(null) }}
                      onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
                      style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', cursor: 'grab', background: '#f1f5f9', opacity: dragIndex === idx ? 0.4 : 1, border: dragOverIndex === idx && dragIndex !== idx ? '3px dashed #10b981' : idx === 0 ? '3px solid #10b981' : '1px solid #e2e8f0', transition: 'border 0.15s, opacity 0.15s' }}
                    >
                      <Image src={url} alt={`Foto ${idx + 1}`} fill unoptimized draggable={false} style={{ objectFit: 'cover', pointerEvents: 'none' }} />
                      <span style={{ position: 'absolute', top: '5px', left: '5px', background: idx === 0 ? '#10b981' : 'rgba(15,23,42,0.75)', color: 'white', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', zIndex: 10 }}>
                        {idx === 0 ? '★ Capa' : `#${idx + 1}`}
                      </span>
                      <div style={{ position: 'absolute', bottom: '5px', left: '5px', right: '5px', display: 'flex', gap: '4px', justifyContent: 'center', zIndex: 10 }}>
                        <button type="button" title="Mover para esquerda" disabled={idx === 0} onClick={() => movePhoto(idx, idx - 1)} style={{ background: 'rgba(15,23,42,0.75)', color: 'white', border: 'none', borderRadius: '4px', padding: '3px', cursor: 'pointer', opacity: idx === 0 ? 0.4 : 1 }}><ChevronLeft size={16} /></button>
                        {idx !== 0 && (
                          <button type="button" title="Definir como capa" onClick={() => movePhoto(idx, 0)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>★ Capa</button>
                        )}
                        <button type="button" title="Mover para direita" disabled={idx === photos.length - 1} onClick={() => movePhoto(idx, idx + 1)} style={{ background: 'rgba(15,23,42,0.75)', color: 'white', border: 'none', borderRadius: '4px', padding: '3px', cursor: 'pointer', opacity: idx === photos.length - 1 ? 0.4 : 1 }}><ChevronRight size={16} /></button>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removePhoto(url)} 
                        style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', zIndex: 10 }}
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
