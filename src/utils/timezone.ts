/**
 * Timezone utilities for Brazil (America/Sao_Paulo)
 * 
 * Este módulo fornece funções robustas para lidar com conversões de timezone
 * garantindo que datas e horários sejam exibidos corretamente no horário de Brasília.
 * 
 * O banco de dados (PostgreSQL/Supabase) armazena timestamps em UTC.
 * Este módulo converte para o timezone brasileiro para exibição correta.
 */

const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

/**
 * Obtém a data/hora atual no timezone do Brasil
 */
export function getNowInBrazil(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
}

/**
 * Converte uma data UTC para o timezone do Brasil
 * @param utcDate - Data em UTC (como vem do banco de dados)
 * @returns Date ajustada para o timezone brasileiro
 */
export function toSaoPauloTime(utcDate: Date | string): Date {
  const date = utcDate instanceof Date ? utcDate : new Date(utcDate)
  // Cria uma nova data baseada na representação local do timezone brasileiro
  return new Date(date.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
}

/**
 * Obtém a hora (0-23) de uma data no timezone do Brasil
 * @param utcDate - Data em UTC
 * @returns Hora no timezone brasileiro (0-23)
 */
export function getHourInBrazil(utcDate: Date | string): number {
  const date = utcDate instanceof Date ? utcDate : new Date(utcDate)
  return parseInt(
    date.toLocaleString('en-US', { 
      timeZone: BRAZIL_TIMEZONE, 
      hour: 'numeric', 
      hour12: false 
    }),
    10
  )
}

/**
 * Obtém o início do dia atual no timezone do Brasil
 * @returns Date representando 00:00:00 de hoje em São Paulo
 */
export function getStartOfTodayInBrazil(): Date {
  const now = getNowInBrazil()
  now.setHours(0, 0, 0, 0)
  return now
}

/**
 * Obtém o início do dia de uma data específica no timezone do Brasil
 * @param utcDate - Data em UTC
 * @returns Date representando 00:00:00 daquele dia em São Paulo
 */
export function getStartOfDayInBrazil(utcDate: Date | string): Date {
  const date = toSaoPauloTime(utcDate)
  date.setHours(0, 0, 0, 0)
  return date
}

/**
 * Formata data para exibição no padrão brasileiro
 * @param utcDate - Data em UTC
 * @param options - Opções de formatação
 * @returns String formatada
 */
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

/**
 * Formata hora para exibição no padrão brasileiro
 * @param utcDate - Data em UTC
 * @returns String no formato "HH:mm"
 */
export function formatTimeBrazil(utcDate: Date | string): string {
  const date = utcDate instanceof Date ? utcDate : new Date(utcDate)
  return date.toLocaleTimeString('pt-BR', { 
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formata data e hora completos para exibição no padrão brasileiro
 * @param utcDate - Data em UTC
 * @returns String no formato "DD/MM/YYYY às HH:mm"
 */
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

/**
 * Compara se duas datas são do mesmo dia no timezone do Brasil
 * @param date1 - Primeira data (UTC)
 * @param date2 - Segunda data (UTC)
 * @returns true se ambas são do mesmo dia em São Paulo
 */
export function isSameDayInBrazil(date1: Date | string, date2: Date | string): boolean {
  const d1 = toSaoPauloTime(date1)
  const d2 = toSaoPauloTime(date2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * Obtém dados do dia da semana no timezone do Brasil
 * @param utcDate - Data em UTC
 * @returns Índice do dia (0=Dom, 6=Sáb) e nome abreviado
 */
export function getDayOfWeekInBrazil(utcDate: Date | string): { index: number; name: string } {
  const date = toSaoPauloTime(utcDate)
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const index = date.getDay()
  return { index, name: dayNames[index] }
}

/**
 * Cria uma data no timezone do Brasil para uso em filtros
 * Útil para criar datas de início/fim para queries
 * @param daysAgo - Número de dias atrás (0 = hoje)
 * @param setToEndOfDay - Se true, define para 23:59:59, senão 00:00:00
 * @returns Date que pode ser usada em queries
 */
export function createBrazilDate(daysAgo: number = 0, setToEndOfDay: boolean = false): Date {
  const now = getNowInBrazil()
  now.setDate(now.getDate() - daysAgo)
  
  if (setToEndOfDay) {
    now.setHours(23, 59, 59, 999)
  } else {
    now.setHours(0, 0, 0, 0)
  }
  
  return now
}

/**
 * Retorna a string do timezone do Brasil para uso em APIs
 */
export function getBrazilTimezone(): string {
  return BRAZIL_TIMEZONE
}
