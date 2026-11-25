/**
 * Timezone utilities for Brazil (America/Sao_Paulo)
 *
 * O banco de dados (PostgreSQL/Supabase) armazena timestamps em UTC.
 * Este módulo converte datas de/para o fuso de Brasília (UTC-3) de forma
 * independente do timezone do servidor Node/Cloud Run.
 */

const BRAZIL_TIMEZONE = 'America/Sao_Paulo'
const BRAZIL_UTC_OFFSET_MS = 3 * 60 * 60 * 1000 // America/Sao_Paulo é UTC-3 fixo (sem horário de verão desde 2019)

/**
 * Obtém componentes (ano, mês, dia, hora) da data no fuso de Brasília.
 */
function getBrazilParts(date: Date): { year: number; month: number; day: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0)
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
  }
}

export function getNowInBrazil(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
}

export function toSaoPauloTime(utcDate: Date | string): Date {
  const date = utcDate instanceof Date ? utcDate : new Date(utcDate)
  return new Date(date.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
}

export function getHourInBrazil(utcDate: Date | string): number {
  const date = utcDate instanceof Date ? utcDate : new Date(utcDate)
  return getBrazilParts(date).hour
}

export function getStartOfTodayInBrazil(): Date {
  return createBrazilDate(0, false)
}

export function getStartOfDayInBrazil(utcDate: Date | string): Date {
  const date = toSaoPauloTime(utcDate)
  date.setHours(0, 0, 0, 0)
  return date
}

export function formatDateBrazil(
  utcDate: Date | string,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }
): string {
  const date = utcDate instanceof Date ? utcDate : new Date(utcDate)
  return date.toLocaleDateString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    ...options
  })
}

export function formatTimeBrazil(utcDate: Date | string): string {
  const date = utcDate instanceof Date ? utcDate : new Date(utcDate)
  return date.toLocaleTimeString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateTimeBrazil(utcDate: Date | string): string {
  const date = utcDate instanceof Date ? utcDate : new Date(utcDate)
  const dateStr = date.toLocaleDateString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  const timeStr = date.toLocaleTimeString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  })
  return `${dateStr} às ${timeStr}`
}

export function isSameDayInBrazil(date1: Date | string, date2: Date | string): boolean {
  const d1 = toSaoPauloTime(date1)
  const d2 = toSaoPauloTime(date2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

export function getDayOfWeekInBrazil(utcDate: Date | string): { index: number; name: string } {
  const date = toSaoPauloTime(utcDate)
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const index = date.getDay()
  return { index, name: dayNames[index] }
}

/**
 * Cria um instante UTC exato correspondente a 00:00:00 (ou 23:59:59.999) no
 * horário de Brasília (`daysAgo` dias atrás), funcionando igual em servidores UTC e locais.
 */
export function createBrazilDate(daysAgo: number = 0, setToEndOfDay: boolean = false): Date {
  const { year, month, day } = getBrazilParts(new Date())
  const utcMidnightOfBrazilDay = Date.UTC(year, month - 1, day - daysAgo, 0, 0, 0, 0) + BRAZIL_UTC_OFFSET_MS
  if (setToEndOfDay) {
    return new Date(utcMidnightOfBrazilDay + (24 * 60 * 60 * 1000 - 1))
  }
  return new Date(utcMidnightOfBrazilDay)
}

export function getBrazilTimezone(): string {
  return BRAZIL_TIMEZONE
}
