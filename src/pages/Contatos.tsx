import { useEffect, useMemo, useState } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Search, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'
import KanbanColumn from '@/components/kanban/KanbanColumn'
import LeadDetailModal from '@/components/kanban/LeadDetailModal'
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from '@/types/database'
import type { LeadPaciente, LeadStatus } from '@/types/database'

const COLUMN_COLORS: Record<LeadStatus, string> = {
  novo_lead: 'bg-sky-400',
  em_atendimento: 'bg-amber-400',
  agendado: 'bg-violet-400',
  compareceu: 'bg-brand-primary',
  perdido: 'bg-rose-400',
}

export default function Contatos() {
  const { instanceId } = useInstance()
  const [leads, setLeads] = useState<LeadPaciente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<LeadPaciente | null>(null)

  useEffect(() => {
    if (!instanceId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('leads_pacientes')
        .select('*')
        .eq('instance_id', instanceId)
        .order('atualizado_em', { ascending: false })

      if (!cancelled) {
        setLeads(data ?? [])
        setLoading(false)
      }
    }

    load()

    const channel = supabase
      .channel(`leads-${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads_pacientes', filter: `instance_id=eq.${instanceId}` },
        (payload) => {
          setLeads((current) => {
            if (payload.eventType === 'DELETE') {
              return current.filter((l) => l.id !== (payload.old as LeadPaciente).id)
            }
            const incoming = payload.new as LeadPaciente
            const exists = current.some((l) => l.id === incoming.id)
            if (exists) {
              return current.map((l) => (l.id === incoming.id ? incoming : l))
            }
            return [incoming, ...current]
          })
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [instanceId])

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return leads
    return leads.filter(
      (l) =>
        (l.nome ?? '').toLowerCase().includes(term) ||
        l.telefone.toLowerCase().includes(term)
    )
  }, [leads, search])

  const leadsByStatus = useMemo(() => {
    const map: Record<LeadStatus, LeadPaciente[]> = {
      novo_lead: [],
      em_atendimento: [],
      agendado: [],
      compareceu: [],
      perdido: [],
    }
    for (const lead of filteredLeads) {
      map[lead.status]?.push(lead)
    }
    return map
  }, [filteredLeads])

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const newStatus = destination.droppableId as LeadStatus
    const previous = leads

    setLeads((current) =>
      current.map((l) =>
        l.id === draggableId ? { ...l, status: newStatus, atualizado_em: new Date().toISOString() } : l
      )
    )

    const { error } = await supabase
      .from('leads_pacientes')
      .update({ status: newStatus, atualizado_em: new Date().toISOString() })
      .eq('id', draggableId)

    if (error) {
      setLeads(previous)
    }
  }

  if (!instanceId) {
    return <p className="text-sm text-gray-400">Selecione uma clínica para visualizar os contatos.</p>
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
          <p className="text-sm text-brand-gray">Acompanhe leads e pacientes por estágio</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="input pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
            {LEAD_STATUS_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                title={LEAD_STATUS_LABELS[status]}
                colorClass={COLUMN_COLORS[status]}
                leads={leadsByStatus[status]}
                onCardClick={setSelectedLead}
              />
            ))}
          </div>
        </DragDropContext>
      )}

      <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  )
}
