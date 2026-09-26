import { Draggable } from '@hello-pangea/dnd'
import { Phone, Clock, Bike, Store } from 'lucide-react'
import type { PedidoComItens } from '@/types/database'
import { formatCurrency, formatDateTime, formatPhone, stripWhatsappSuffix } from '@/lib/format'

const MAX_ITENS_RESUMO = 3

interface PedidoCardProps {
  pedido: PedidoComItens
  index: number
  onClick: () => void
}

export default function PedidoCard({ pedido, index, onClick }: PedidoCardProps) {
  const telefone = formatPhone(stripWhatsappSuffix(pedido.telefone))
  const itensResumo = pedido.itens_pedido.slice(0, MAX_ITENS_RESUMO)
  const itensRestantes = pedido.itens_pedido.length - itensResumo.length

  return (
    <Draggable draggableId={pedido.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-brand-primary/60 ${
            snapshot.isDragging ? 'ring-2 ring-brand-primary' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-medium text-gray-900">
              {pedido.nome_cliente || telefone}
            </p>
            <span className="shrink-0 text-sm font-semibold text-gray-900">
              {formatCurrency(Number(pedido.total))}
            </span>
          </div>

          {pedido.nome_cliente && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <Phone className="h-3 w-3" />
              {telefone}
            </p>
          )}

          {itensResumo.length > 0 ? (
            <ul className="mt-2 space-y-0.5 text-xs text-gray-600">
              {itensResumo.map((item) => (
                <li key={item.id} className="truncate">
                  {item.quantidade}x {item.nome_item}
                </li>
              ))}
              {itensRestantes > 0 && (
                <li className="text-gray-400">+{itensRestantes} {itensRestantes === 1 ? 'item' : 'itens'}</li>
              )}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-gray-400">Sem itens</p>
          )}

          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {formatDateTime(pedido.criado_em)}
            </span>
            {pedido.tipo_entrega && (
              <span className="flex items-center gap-1 text-gray-500">
                {pedido.tipo_entrega === 'entrega' ? (
                  <Bike className="h-3 w-3" />
                ) : (
                  <Store className="h-3 w-3" />
                )}
                {pedido.tipo_entrega === 'entrega' ? 'Entrega' : 'Retirada'}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
