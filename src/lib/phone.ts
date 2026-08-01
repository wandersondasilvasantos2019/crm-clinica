/**
 * Máscara/normalização de telefone para o formulário público de agendamento.
 * O restante do sistema armazena telefone com DDI (55 + DDD + número,
 * 13 dígitos) — ver formatPhone em lib/format.ts — então normalizamos
 * para o mesmo formato antes de gravar no Supabase.
 */

export function maskPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function isValidPhoneInput(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || digits.length === 11
}

export function normalizePhoneForStorage(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('55')) return digits
  return `55${digits}`
}
