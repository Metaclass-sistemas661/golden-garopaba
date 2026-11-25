/**
 * Utilitários compartilhados para exibição, sanitização, preços e proteção de mídia.
 */

export const DEFAULT_WHATSAPP_NUMBER = '5548996435501'

export function normalizeWhatsappNumber(raw?: string | null): string {
  const digits = (raw || '').replace(/\D/g, '')
  if (!digits) return DEFAULT_WHATSAPP_NUMBER
  return digits.startsWith('55') ? digits : `55${digits}`
}

export function buildWhatsappUrl(message: string, rawNumber?: string | null): string {
  const phone = normalizeWhatsappNumber(rawNumber)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function formatBRL(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits,
  }).format(value)
}

export function getEffectivePropertyPrice(property: {
  transactionType: string
  price?: number | null
  rentPrice?: number | null
}): number {
  const price = Number(property.price || 0)
  const rentPrice = Number(property.rentPrice || 0)
  if (property.transactionType === 'RENT') {
    return rentPrice > 0 ? rentPrice : price
  }
  return price > 0 ? price : rentPrice
}

export function formatPropertyPriceLabel(property: {
  transactionType: string
  price?: number | null
  rentPrice?: number | null
}): string {
  const price = Number(property.price || 0)
  const rentPrice = Number(property.rentPrice || 0)

  if (property.transactionType === 'RENT') {
    if (rentPrice > 0) return `${formatBRL(rentPrice)}/mês`
    if (price > 0) return `${formatBRL(price)}/mês`
    return 'Sob Consulta'
  }

  if (price > 0) return formatBRL(price)
  if (rentPrice > 0) return `${formatBRL(rentPrice)}/mês`
  return 'Sob Consulta'
}

export function getTransactionTagLabel(transactionType: string): string {
  switch (transactionType) {
    case 'SALE':
      return 'Venda'
    case 'RENT':
      return 'Aluguel'
    case 'LANCAMENTO':
      return 'Lançamento'
    default:
      return transactionType
  }
}

export function getTransactionActionLabel(transactionType: string): string {
  switch (transactionType) {
    case 'SALE':
      return 'Comprar'
    case 'RENT':
      return 'Alugar'
    case 'LANCAMENTO':
      return 'Lançamento'
    default:
      return transactionType
  }
}

/**
 * Normaliza texto para busca sem distinção de maiúsculas ou acentos.
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Domínios configurados em `next.config.ts` para otimização via `next/image`.
 */
const OPTIMIZABLE_HOSTS = new Set([
  'ynvcktbpbvappvcynpfe.supabase.co',
  'images.unsplash.com',
  'goldengaropaba.com.br',
  'www.goldengaropaba.com.br',
])

export function shouldUnoptimizeImage(src: string): boolean {
  if (!src) return true
  if (src.startsWith('blob:') || src.startsWith('data:')) return true
  if (src.startsWith('/')) return src.endsWith('.svg')
  try {
    const parsed = new URL(src)
    return !OPTIMIZABLE_HOSTS.has(parsed.hostname)
  } catch {
    return true
  }
}

/**
 * Sanitizador HTML leve para descrições rich-text (previne XSS sem dependências externas).
 * Remove scripts, iframes, objetos, handlers `on*` e URLs `javascript:`/`data:`.
 */
export function sanitizeRichHtml(html: string | null | undefined): string {
  if (!html) return ''

  const allowedTags = new Set([
    'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
    'ul', 'ol', 'li', 'div', 'span', 'font', 'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr',
  ])

  let clean = html
    // Remove tags perigosas e seu conteúdo
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|form|input|textarea|select|button)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|form|input|textarea|select|button|meta|link|base)[^>]*\/?>/gi, '')
    // Remove comentários HTML
    .replace(/<!--[\s\S]*?-->/g, '')

  // Filtra tags restantes mantendo apenas whitelist e atributos seguros
  clean = clean.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (full: string, rawTag: string, rawAttrs: string = '') => {
    const tag = rawTag.toLowerCase()
    if (!allowedTags.has(tag)) return ''
    if (full.startsWith('</')) return `</${tag}>`

    const safeAttrs: string[] = []
    if (rawAttrs) {
      // Preserva apenas color (em <font>) e style seguro (color, text-align, font-*)
      const styleMatch = rawAttrs.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
      if (styleMatch) {
        const styleVal = String(styleMatch[1] ?? styleMatch[2] ?? '')
        const safeRules = styleVal
          .split(';')
          .map((r: string) => r.trim())
          .filter((r: string) => {
            const prop = r.split(':')[0]?.trim().toLowerCase()
            const val = r.split(':').slice(1).join(':').trim().toLowerCase()
            if (!prop || !val) return false
            if (val.includes('expression(') || val.includes('url(') || val.includes('javascript:')) return false
            return ['color', 'background-color', 'text-align', 'font-weight', 'font-style', 'text-decoration'].includes(prop)
          })
        if (safeRules.length > 0) {
          safeAttrs.push(`style="${safeRules.join('; ').replace(/"/g, '&quot;')}"`)
        }
      }

      if (tag === 'font') {
        const colorMatch = rawAttrs.match(/\bcolor\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)
        const colorVal = (colorMatch?.[1] ?? colorMatch?.[2] ?? colorMatch?.[3] ?? '').trim()
        if (/^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(colorVal)) {
          safeAttrs.push(`color="${colorVal}"`)
        }
      }
    }

    const attrsStr = safeAttrs.length > 0 ? ` ${safeAttrs.join(' ')}` : ''
    return tag === 'br' || tag === 'hr' ? `<${tag} />` : `<${tag}${attrsStr}>`
  })

  return clean
}
