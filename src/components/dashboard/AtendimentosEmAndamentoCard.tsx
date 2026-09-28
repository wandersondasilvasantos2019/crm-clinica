import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/format'
import type { LeadPaciente } from '@/types/database'

interface AtendimentoEmAndamento {
  lead: LeadPaciente
  ultimaMensagem: string | null
  horario: string | null
}

/**
 * Mesmo card "Atendimentos em andamento" do dashboard de agendamento (mesma
 * consulta e visual), em componente próprio para o dashboard de pedidos.
 */
export default function AtendimentosEmAndamentoCard({ instanceId }: { instanceId: string }) {
  const [emAndamento, setEmAndamento] = useState<AtendimentoEmAndamento[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await supabase
        .from('leads_pacientes')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('status', 'em_atendimento')
        .order('atualizado_em', { ascending: false })
        .limit(5)

      const leads = (data ?? []) as LeadPaciente[]
      if (leads.length === 0) {
        if (!cancelled) setEmAndamento([])
        return
      }

      const { data: conversasData } = await supabase
        .from('conversas')
        .select('*')
        .eq('instance_id', instanceId)
        .in(
          'telefone',
          leads.map((l) => l.telefone)
        )
        .order('criado_em', { ascending: false })

      if (cancelled) return
      const latestByTelefone = new Map<string, { mensagem: string; criado_em: string }>()
      for (const c of conversasData ?? []) {
        if (!latestByTelefone.has(c.telefone)) {
          latestByTelefone.set(c.telefone, { mensagem: c.mensagem, criado_em: c.criado_em })
        }
      }
      setEmAndamento(
        leads.map((lead) => {
          const ultima = latestByTelefone.get(lead.telefone)
          return { lead, ultimaMensagem: ultima?.mensagem ?? null, horario: ultima?.criado_em ?? null }
        })
      )
    }

    load()
    return () => {
      cancelled = true
    }
  }, [instanceId])

  return (
    <div className="card">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Atendimentos em andamento</h2>
      {emAndamento.length === 0 ? (
        <p className="text-sm text-brand-gray">Nenhum atendimento em andamento.</p>
      ) : (
        <ul className="space-y-3">
          {emAndamento.map(({ lead, ultimaMensagem, horario }) => (
            <li key={lead.id} className="flex items-center gap-3 text-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-semibold text-brand-primary">
                {(lead.nome ?? lead.telefone).slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{lead.nome ?? lead.telefone}</p>
                <p className="truncate text-xs text-brand-gray">{ultimaMensagem ?? 'Sem mensagens recentes'}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {horario && <span className="text-xs text-brand-gray">{formatDateTime(horario)}</span>}
                <span className="badge bg-brand-primary/10 text-brand-dark">
                  <MessageCircle className="mr-1 h-3 w-3" />
                  Em atendimento
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/app/atendimentos"
        className="mt-4 inline-block text-xs font-medium text-brand-primary hover:underline"
      >
        Ver todos →
      </Link>
    </div>
  )
}
