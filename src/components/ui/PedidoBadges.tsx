import clsx from 'clsx'
import type { StatusPedido } from '@/types/database'
import { STATUS_PEDIDO_LABELS } from '@/types/database'

const PEDIDO_COLORS: Record<StatusPedido, string> = {
  novo: 'bg-sky-100 text-sky-700',
  confirmado: 'bg-violet-100 text-violet-700',
  preparando: 'bg-amber-100 text-amber-700',
  entregue: 'bg-brand-secondary/10 text-brand-primary',
  cancelado: 'bg-rose-100 text-rose-700',
}

export function PedidoStatusBadge({ status }: { status: StatusPedido }) {
  return (
    <span className={clsx('badge', PEDIDO_COLORS[status])}>{STATUS_PEDIDO_LABELS[status]}</span>
  )
}

export function AtivoBadge({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={clsx(
        'badge',
        ativo ? 'bg-brand-secondary/10 text-brand-primary' : 'bg-gray-100 text-gray-500'
      )}
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )
}
