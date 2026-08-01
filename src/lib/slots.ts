import type { HorarioDisponivel } from '@/types/database'

export interface OcupacaoExistente {
  inicioMinutos: number
  duracaoMinutos: number
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function toTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Próximos 14 dias a partir de hoje (incluso), como Date à meia-noite local. */
export function getNext14Days(): Date[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function isDayEnabled(date: Date, horarios: HorarioDisponivel[]): boolean {
  return horarios.some((h) => h.dia_semana === date.getDay())
}

/** Gera os horários possíveis (HH:mm) para um dia, dado o step de duração do serviço. */
export function buildTimeSlots(horariosDoDia: HorarioDisponivel[], duracaoMinutos: number): string[] {
  const slots = new Set<string>()

  for (const horario of horariosDoDia) {
    const inicio = toMinutes(horario.hora_inicio)
    const fim = toMinutes(horario.hora_fim)
    for (let m = inicio; m + duracaoMinutos <= fim; m += duracaoMinutos) {
      slots.add(toTimeString(m))
    }
  }

  return Array.from(slots).sort()
}

/** Remove slots que colidem com agendamentos já existentes, e (se for hoje) horários já passados. */
export function filterAvailableSlots(
  slots: string[],
  duracaoMinutos: number,
  ocupacoes: OcupacaoExistente[],
  date: Date
): string[] {
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const minutosAgora = now.getHours() * 60 + now.getMinutes()

  return slots.filter((slot) => {
    const inicio = toMinutes(slot)
    const fim = inicio + duracaoMinutos

    if (isToday && inicio <= minutosAgora) return false

    return !ocupacoes.some((o) => inicio < o.inicioMinutos + o.duracaoMinutos && o.inicioMinutos < fim)
  })
}

/** Combina uma data (Y/M/D) com um horário "HH:mm" (local) em um único Date. */
export function combineDateAndTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const combined = new Date(date)
  combined.setHours(h, m, 0, 0)
  return combined
}

export function minutesFromDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}
