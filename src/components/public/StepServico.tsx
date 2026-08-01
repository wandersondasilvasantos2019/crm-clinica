import { Loader2, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { Servico } from '@/types/database'

interface StepServicoProps {
  servicos: Servico[]
  loading: boolean
  onSelect: (servico: Servico) => void
}

export default function StepServico({ servicos, loading, onSelect }: StepServicoProps) {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  if (servicos.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">
        Nenhum serviço disponível para agendamento no momento.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Escolha o serviço</h2>
      <div className="space-y-2.5">
        {servicos.map((servico) => (
          <button
            key={servico.id}
            onClick={() => onSelect(servico)}
            className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:shadow-md active:scale-[0.99]"
          >
            <p className="font-medium text-gray-900">{servico.nome}</p>
            {servico.descricao && (
              <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{servico.descricao}</p>
            )}
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                {servico.duracao_minutos} min
              </span>
              <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                {formatCurrency(Number(servico.valor))}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
