/**
 * Address Validation & Sanitization — Enterprise Grade
 *
 * Validates and sanitizes structured address fields on the server side
 * before persisting to the database. This is the second layer of defense
 * (the first being client-side validation in PropertyForm.tsx).
 */

// All valid Brazilian state abbreviations
const VALID_UF = new Set([
  'AC','AL','AP','AM','BA','CE','DF','ES','GO',
  'MA','MT','MS','MG','PA','PB','PR','PE','PI',
  'RJ','RN','RS','RO','RR','SC','SP','SE','TO'
])

export interface AddressValidationResult {
  valid: boolean
  errors: string[]
  sanitized: {
    street:       string | null
    number:       string | null
    complement:   string | null
    neighborhood: string | null
    city:         string | null
    state:        string | null
    zipCode:      string | null
  }
}

/**
 * Strips all non-digit characters from a string.
 */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Capitalizes the first letter of each word (title case),
 * preserving prepositions in lower case (de, da, do, das, dos, e).
 */
function toTitleCase(value: string): string {
  const lower = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas']
  return value
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((word, i) => (i === 0 || !lower.includes(word))
      ? word.charAt(0).toUpperCase() + word.slice(1)
      : word
    )
    .join(' ')
}

/**
 * Sanitizes a free-text address field: trims, collapses whitespace,
 * applies title case, and enforces a max length.
 */
function sanitizeText(value: string | null | undefined, maxLen = 150): string | null {
  if (!value || !value.trim()) return null
  const clean = value.trim().replace(/\s+/g, ' ').slice(0, maxLen)
  return toTitleCase(clean)
}

/**
 * Validates and sanitizes the full structured address payload.
 * Returns a typed result with error list and cleaned values.
 *
 * Rules:
 *  - zipCode: must be exactly 8 digits (if provided)
 *  - state: must be a valid 2-letter Brazilian UF code (if provided)
 *  - street/neighborhood/city: title-cased and trimmed
 *  - All fields are optional (imóveis without full address are allowed)
 */
export function validateAndSanitizeAddress(input: {
  street?:       string | null
  number?:       string | null
  complement?:   string | null
  neighborhood?: string | null
  city?:         string | null
  state?:        string | null
  zipCode?:      string | null
}): AddressValidationResult {
  const errors: string[] = []

  // ── CEP Validation ──────────────────────────────────────────────────────────
  let cleanZip: string | null = null
  if (input.zipCode) {
    const digits = digitsOnly(input.zipCode)
    if (digits.length > 0 && digits.length !== 8) {
      errors.push(`CEP inválido: "${input.zipCode}" — deve ter exatamente 8 dígitos.`)
    } else if (digits.length === 8) {
      // Basic range check: valid Brazilian CEPs start from 01000000 to 99999999
      const cepNum = parseInt(digits, 10)
      if (cepNum < 1000000) {
        errors.push(`CEP inválido: "${input.zipCode}" — valor fora do intervalo válido.`)
      } else {
        cleanZip = digits
      }
    }
  }

  // ── State / UF Validation ───────────────────────────────────────────────────
  let cleanState: string | null = null
  if (input.state) {
    const uf = input.state.trim().toUpperCase()
    if (uf.length > 0 && !VALID_UF.has(uf)) {
      errors.push(`Estado inválido: "${input.state}" — use a sigla de 2 letras (ex: SC, SP, RJ).`)
    } else if (uf.length > 0) {
      cleanState = uf
    }
  }

  // ── Text Field Sanitization ─────────────────────────────────────────────────
  const cleanStreet       = sanitizeText(input.street, 150)
  const cleanNumber       = input.number?.trim().slice(0, 20) || null  // keep as-is (S/N, 123-A, etc.)
  const cleanComplement   = input.complement?.trim().slice(0, 100) || null
  const cleanNeighborhood = sanitizeText(input.neighborhood, 100)
  const cleanCity         = sanitizeText(input.city, 100)

  // ── Cross-field consistency warnings (non-blocking) ─────────────────────────
  // If a zipCode is provided, city should also be present (for geocoding quality)
  if (cleanZip && !cleanCity) {
    console.warn('[ADDRESS] CEP fornecido sem cidade — geocoding pode ser impreciso.')
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      street:       cleanStreet,
      number:       cleanNumber,
      complement:   cleanComplement,
      neighborhood: cleanNeighborhood,
      city:         cleanCity,
      state:        cleanState,
      zipCode:      cleanZip,
    }
  }
}
