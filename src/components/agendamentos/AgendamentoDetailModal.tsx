import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import { AgendamentoStatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime, formatPhone } from '@/lib/format'
import type { AgendamentoDetalhado } from '@/types/database'

interface AgendamentoDetailModalProps {
  agendamento: AgendamentoDetalhado | null
  onClose: () => void
  onUpdated: () => void
}

export default function AgendamentoDetailModal({
  agendamento,
  onClose,
  onUpdated,
}: AgendamentoDetailModalProps) {
  const [submitting, setSubmitting] = useState(false)

  async function updateStatus(status: 'cancelado' | 'realizado') {
    if (!agendamento) return
    setSubmitting(true)
    const { error } = await supabase
      .from('agendamentos')
      .update({ status })
      .eq('id', agendamento.id)
    setSubmitting(false)
    if (!error) {
      onUpdated()
      onClose()
    }
  }

  return (
    <Modal open={!!agendamento} onClose={onClose} title="Detalhes do agendamento">
      {agendamento && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-900">
              {agendamento.lead?.nome || 'Sem nome'}
            </h3>
            <AgendamentoStatusBadge status={agendamento.status} />
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-400">Telefone</dt>
              <dd className="text-gray-700">
                {agendamento.lead ? formatPhone(agendamento.lead.telefone) : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Serviço</dt>
              <dd className="text-gray-700">{agendamento.servico?.nome ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Valor</dt>
              <dd className="text-gray-700">
                {agendamento.servico ? formatCurrency(Number(agendamento.servico.valor)) : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Profissional</dt>
              <dd className="text-gray-700">{agendamento.profissional?.nome ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Data e hora</dt>
              <dd className="text-gray-700">{formatDateTime(agendamento.data_hora)}</dd>
            </div>
          </dl>

          {agendamento.status === 'confirmado' && (
            <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
              <button
                className="btn-danger"
                disabled={submitting}
                onClick={() => updateStatus('cancelado')}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Cancelar
              </button>
              <button
                className="btn-primary"
                disabled={submitting}
                onClick={() => updateStatus('realizado')}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Marcar como realizado
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
