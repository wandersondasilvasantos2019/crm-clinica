export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

/**
 * Postgres `timestamp` columns (no timezone) get serialized by PostgREST
 * without a 'Z'/offset suffix even when the value is stored in UTC — e.g.
 * "2026-08-04T17:38:00" instead of "...Z". The native Date constructor
 * treats a timezone-less ISO string as *local* time, not UTC, which
 * silently skips the conversion (symptom: displayed time is off by
 * exactly the browser's UTC offset). Treat any string missing an explicit
 * 'Z' or +hh:mm/-hh:mm offset as UTC before parsing.
 */
function parseAsUtc(value: string | Date): Date {
  if (value instanceof Date) return value
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(value)
  return new Date(hasTimezone ? value : `${value}Z`)
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = parseAsUtc(value)
  return new Intl.DateTimeFormat('pt-BR', opts ?? { dateStyle: 'short' }).format(date)
}

export function formatDateTime(value: string | Date): string {
  const date = parseAsUtc(value)
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 13) {
    // 55 11 91234 5678
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  return phone
}

/**
 * WhatsApp JIDs (Baileys/n8n) come as "556791181262@c.us" or "...@lid" —
 * strip the suffix before formatting for display.
 */
export function stripWhatsappSuffix(telefone: string | null | undefined): string {
  if (!telefone) return '';
  return telefone.replace(/@c\.us$|@lid$/, ''); 
}

export function formatRelativeTime(value: string | Date): string {
  const date = parseAsUtc(value)
  const diffMs = date.getTime() - Date.now()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)

  if (Math.abs(diffDay) >= 7) return formatDate(date)

  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
  if (Math.abs(diffDay) >= 1) return rtf.format(diffDay, 'day')
  if (Math.abs(diffHour) >= 1) return rtf.format(diffHour, 'hour')
  if (Math.abs(diffMin) >= 1) return rtf.format(diffMin, 'minute')
  return 'agora'
}
