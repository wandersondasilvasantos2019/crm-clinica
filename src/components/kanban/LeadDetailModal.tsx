import { useEffect, useState } from 'react'
import { Loader2, MessageSquare, CalendarDays } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import { AgendamentoStatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatPhone } from '@/lib/format'
import type { Conversa, LeadPaciente } from '@/types/database'

interface AgendamentoRow {
  id: string
  data_hora: string
  status: 'confirmado' | 'cancelado' | 'realizado'
  servicos: { nome: string } | null
  profissionais: { nome: string } | null
}

interface LeadDetailModalProps {
  lead: LeadPaciente | null
  onClose: () => void
}

export default function LeadDetailModal({ lead, onClose }: LeadDetailModalProps) {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [agendamentos, setAgendamentos] = useState<AgendamentoRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!lead) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const [conversasRes, agendamentosRes] = await Promise.all([
        supabase
          .from('conversas')
          .select('*')
          .eq('telefone', lead!.telefone)
          .order('criado_em', { ascending: true }),
        supabase
          .from('agendamentos')
          .select('id, data_hora, status, servicos(nome), profissionais(nome)')
          .eq('lead_id', lead!.id)
          .order('data_hora', { ascending: false }),
      ])

      if (cancelled) return
      setConversas(conversasRes.data ?? [])
      setAgendamentos((agendamentosRes.data as unknown as AgendamentoRow[]) ?? [])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [lead])

  return (
    <Modal open={!!lead} onClose={onClose} title={lead?.nome || 'Lead sem nome'} maxWidth="max-w-2xl">
      {lead && (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">{formatPhone(lead.telefone)}</p>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
            </div>
          ) : (
            <>
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <CalendarDays className="h-4 w-4" /> Agendamentos
                </h3>
                {agendamentos.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhum agendamento vinculado.</p>
                ) : (
                  <ul className="space-y-2">
                    {agendamentos.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {a.servicos?.nome ?? 'Serviço'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDateTime(a.data_hora)}
                            {a.profissionais?.nome ? ` · ${a.profissionais.nome}` : ''}
                          </p>
                        </div>
                        <AgendamentoStatusBadge status={a.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <MessageSquare className="h-4 w-4" /> Histórico de mensagens
                </h3>
                {conversas.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma conversa registrada.</p>
                ) : (
                  <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {conversas.map((c) => {
                      const isPaciente = c.role === 'paciente'
                      return (
                        <div
                          key={c.id}
                          className={clsx('flex', isPaciente ? 'justify-start' : 'justify-end')}
                        >
                          <div
                            className={clsx(
                              'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                              isPaciente
                                ? 'border border-gray-200 bg-white text-gray-900'
                                : 'bg-brand-secondary/10 text-brand-primary'
                            )}
                          >
                            <p>{c.mensagem}</p>
                            <p className="mt-1 text-[10px] text-gray-400">
                              {formatDateTime(c.criado_em)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
