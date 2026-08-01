import { useEffect, useState } from 'react'
import { CalendarRange, List, Loader2, Plus } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'
import CalendarView from '@/components/agendamentos/CalendarView'
import TableView from '@/components/agendamentos/TableView'
import NovoAgendamentoModal from '@/components/agendamentos/NovoAgendamentoModal'
import AgendamentoDetailModal from '@/components/agendamentos/AgendamentoDetailModal'
import type { AgendamentoDetalhado, Profissional } from '@/types/database'

type ViewMode = 'calendario' | 'tabela'

export default function Agendamentos() {
  const { instanceId } = useInstance()
  const [agendamentos, setAgendamentos] = useState<AgendamentoDetalhado[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [profissionalFiltro, setProfissionalFiltro] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('calendario')
  const [loading, setLoading] = useState(true)
  const [novoAgendamentoOpen, setNovoAgendamentoOpen] = useState(false)
  const [slotSelecionado, setSlotSelecionado] = useState<Date | null>(null)
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoDetalhado | null>(
    null
  )

  async function loadAgendamentos() {
    if (!instanceId) return
    setLoading(true)

    let query = supabase
      .from('agendamentos')
      .select('*, lead:leads_pacientes(*), servico:servicos(*), profissional:profissionais(*)')
      .eq('instance_id', instanceId)
      .order('data_hora', { ascending: true })

    if (profissionalFiltro) {
      query = query.eq('profissional_id', profissionalFiltro)
    }

    const { data } = await query
    setAgendamentos((data as unknown as AgendamentoDetalhado[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadAgendamentos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId, profissionalFiltro])

  useEffect(() => {
    if (!instanceId) return
    supabase
      .from('profissionais')
      .select('*')
      .eq('instance_id', instanceId)
      .order('nome')
      .then(({ data }) => setProfissionais(data ?? []))
  }, [instanceId])

  function handleSelectSlot(date: Date) {
    setSlotSelecionado(date)
    setNovoAgendamentoOpen(true)
  }

  if (!instanceId) {
    return <p className="text-sm text-gray-400">Selecione uma clínica para visualizar os agendamentos.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Agendamentos</h1>
          <p className="text-sm text-gray-400">Gerencie a agenda da clínica</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setSlotSelecionado(null)
            setNovoAgendamentoOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Novo agendamento
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          className="input sm:w-64"
          value={profissionalFiltro}
          onChange={(e) => setProfissionalFiltro(e.target.value)}
        >
          <option value="" className="bg-gray-50">
            Todos os profissionais
          </option>
          {profissionais.map((p) => (
            <option key={p.id} value={p.id} className="bg-gray-50">
              {p.nome}
            </option>
          ))}
        </select>

        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setViewMode('calendario')}
            className={clsx(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
              viewMode === 'calendario' ? 'bg-emerald-600 text-white' : 'text-gray-500'
            )}
          >
            <CalendarRange className="h-4 w-4" />
            Calendário
          </button>
          <button
            onClick={() => setViewMode('tabela')}
            className={clsx(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
              viewMode === 'tabela' ? 'bg-emerald-600 text-white' : 'text-gray-500'
            )}
          >
            <List className="h-4 w-4" />
            Tabela
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : viewMode === 'calendario' ? (
        <CalendarView
          agendamentos={agendamentos}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={setAgendamentoSelecionado}
        />
      ) : (
        <TableView agendamentos={agendamentos} onSelect={setAgendamentoSelecionado} />
      )}

      <NovoAgendamentoModal
        open={novoAgendamentoOpen}
        onClose={() => setNovoAgendamentoOpen(false)}
        onCreated={loadAgendamentos}
        instanceId={instanceId}
        initialDate={slotSelecionado}
      />

      <AgendamentoDetailModal
        agendamento={agendamentoSelecionado}
        onClose={() => setAgendamentoSelecionado(null)}
        onUpdated={loadAgendamentos}
      />
    </div>
  )
}
