import { useState } from 'react'
import { Loader2, ShoppingBag, MapPin, StickyNote, Bike, Store } from 'lucide-react'
import clsx from 'clsx'
import Modal from '@/components/ui/Modal'
import { PedidoStatusBadge } from '@/components/ui/PedidoBadges'
import { formatCurrency, formatDateTime, formatPhone, stripWhatsappSuffix } from '@/lib/format'
import { STATUS_PEDIDO_FLUXO, STATUS_PEDIDO_LABELS } from '@/types/database'
import type { PedidoComItens, StatusPedido } from '@/types/database'

interface PedidoDetailModalProps {
  pedido: PedidoComItens | null
  onClose: () => void
  onStatusChange: (pedido: PedidoComItens, status: StatusPedido) => Promise<boolean>
}

export default function PedidoDetailModal({ pedido, onClose, onStatusChange }: PedidoDetailModalProps) {
  const [updating, setUpdating] = useState<StatusPedido | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleStatus(status: StatusPedido) {
    if (!pedido || status === pedido.status) return
    setUpdating(status)
    setError(null)
    const ok = await onStatusChange(pedido, status)
    setUpdating(null)
    if (!ok) setError('Não foi possível atualizar o status. Tente novamente.')
  }

  const telefone = pedido ? formatPhone(stripWhatsappSuffix(pedido.telefone)) : ''

  return (
    <Modal
      open={!!pedido}
      onClose={onClose}
      title={pedido?.nome_cliente || telefone || 'Pedido'}
      maxWidth="max-w-2xl"
    >
      {pedido && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-gray-500">
              <p>{telefone}</p>
              <p className="text-xs text-gray-400">Criado em {formatDateTime(pedido.criado_em)}</p>
            </div>
            <PedidoStatusBadge status={pedido.status} />
          </div>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <ShoppingBag className="h-4 w-4" /> Itens
            </h3>
            {pedido.itens_pedido.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum item registrado.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {pedido.itens_pedido.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.quantidade}x {item.nome_item}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(Number(item.preco_unitario))} cada
                      </p>
                    </div>
                    <span className="text-gray-700">
                      {formatCurrency(Number(item.preco_unitario) * item.quantidade)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex justify-end text-sm">
              <span className="text-gray-500">Total:&nbsp;</span>
              <span className="font-semibold text-gray-900">{formatCurrency(Number(pedido.total))}</span>
            </div>
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              {pedido.tipo_entrega === 'entrega' ? <Bike className="h-4 w-4" /> : <Store className="h-4 w-4" />}
              {pedido.tipo_entrega === 'entrega'
                ? 'Entrega'
                : pedido.tipo_entrega === 'retirada'
                  ? 'Retirada no local'
                  : 'Tipo de entrega não informado'}
            </h3>
            {pedido.endereco_entrega && (
              <p className="flex items-start gap-2 text-sm text-gray-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                {pedido.endereco_entrega}
              </p>
            )}
          </section>

          {pedido.observacoes && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <StickyNote className="h-4 w-4" /> Observações
              </h3>
              <p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                {pedido.observacoes}
              </p>
            </section>
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Mudar status</h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_PEDIDO_FLUXO.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={updating !== null}
                  onClick={() => handleStatus(status)}
                  className={clsx(
                    status === pedido.status ? 'btn-primary' : 'btn-secondary',
                    'text-xs'
                  )}
                >
                  {updating === status && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {STATUS_PEDIDO_LABELS[status]}
                </button>
              ))}
              <button
                type="button"
                disabled={updating !== null || pedido.status === 'cancelado'}
                onClick={() => {
                  if (confirm('Cancelar este pedido?')) handleStatus('cancelado')
                }}
                className="btn-danger text-xs"
              >
                {updating === 'cancelado' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {pedido.status === 'cancelado' ? 'Cancelado' : 'Cancelar pedido'}
              </button>
            </div>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          </section>
        </div>
      )}
    </Modal>
  )
}
