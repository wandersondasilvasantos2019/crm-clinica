import { AgendamentoStatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatPhone } from '@/lib/format'
import type { AgendamentoDetalhado } from '@/types/database'

interface TableViewProps {
  agendamentos: AgendamentoDetalhado[]
  onSelect: (agendamento: AgendamentoDetalhado) => void
}

export default function TableView({ agendamentos, onSelect }: TableViewProps) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3 font-medium">Data e hora</th>
            <th className="px-4 py-3 font-medium">Paciente</th>
            <th className="px-4 py-3 font-medium">Telefone</th>
            <th className="px-4 py-3 font-medium">Serviço</th>
            <th className="px-4 py-3 font-medium">Profissional</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {agendamentos.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                Nenhum agendamento encontrado.
              </td>
            </tr>
          ) : (
            agendamentos
              .slice()
              .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
              .map((a) => (
                <tr
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-gray-700">{formatDateTime(a.data_hora)}</td>
                  <td className="px-4 py-3 text-gray-900">{a.lead?.nome ?? 'Sem nome'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {a.lead ? formatPhone(a.lead.telefone) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{a.servico?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{a.profissional?.nome ?? '—'}</td>
                  <td className="px-4 py-3">
                    <AgendamentoStatusBadge status={a.status} />
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>
    </div>
  )
}
