// Helper functions for masking and parsing values

export const formatCurrency = (val: string | number | undefined | null) => {
  if (val === undefined || val === null || val === '') return ''
  
  // Se for string, tenta limpar primeiro
  let numericVal = typeof val === 'string' ? Number(val.replace(/\D/g, '')) / 100 : Number(val)
  
  if (isNaN(numericVal)) return ''
  
  return numericVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const formatCurrencyInput = (value: string) => {
  let v = value.replace(/\D/g, '')
  if (v === '') return ''
  const numberValue = parseInt(v, 10) / 100
  return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const parseCurrencyToNumber = (val: string | number) => {
  if (!val) return null
  if (typeof val === 'number') return val
  const digits = val.toString().replace(/\D/g, '')
  if (!digits) return null
  return Number(digits) / 100
}

export const formatNumberInput = (value: string) => {
  return value.replace(/\D/g, '')
}
