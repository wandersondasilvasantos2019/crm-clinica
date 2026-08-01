import clsx from 'clsx'
import type { LeadStatus, AgendamentoStatus } from '@/types/database'
import { LEAD_STATUS_LABELS, AGENDAMENTO_STATUS_LABELS } from '@/types/database'

const LEAD_COLORS: Record<LeadStatus, string> = {
  novo_lead: 'bg-sky-100 text-sky-700',
  em_atendimento: 'bg-amber-100 text-amber-700',
  agendado: 'bg-violet-100 text-violet-700',
  compareceu: 'bg-emerald-100 text-emerald-800',
  perdido: 'bg-rose-100 text-rose-700',
}

const AGENDAMENTO_COLORS: Record<AgendamentoStatus, string> = {
  confirmado: 'bg-emerald-100 text-emerald-800',
  cancelado: 'bg-rose-100 text-rose-700',
  realizado: 'bg-sky-100 text-sky-700',
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={clsx('badge', LEAD_COLORS[status])}>{LEAD_STATUS_LABELS[status]}</span>
  )
}

export function AgendamentoStatusBadge({ status }: { status: AgendamentoStatus }) {
  return (
    <span className={clsx('badge', AGENDAMENTO_COLORS[status])}>
      {AGENDAMENTO_STATUS_LABELS[status]}
    </span>
  )
}
