import { Droppable } from '@hello-pangea/dnd'
import type { LeadPaciente, LeadStatus } from '@/types/database'
import LeadCard from './LeadCard'

interface KanbanColumnProps {
  status: LeadStatus
  title: string
  colorClass: string
  leads: LeadPaciente[]
  onCardClick: (lead: LeadPaciente) => void
}

export default function KanbanColumn({
  status,
  title,
  colorClass,
  leads,
  onCardClick,
}: KanbanColumnProps) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-gray-100 bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${colorClass}`} />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          {leads.length}
        </span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-2 transition ${
              snapshot.isDraggingOver ? 'bg-emerald-500/5' : ''
            }`}
          >
            {leads.map((lead, index) => (
              <LeadCard key={lead.id} lead={lead} index={index} onClick={() => onCardClick(lead)} />
            ))}
            {provided.placeholder}
            {leads.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-gray-400">Nenhum lead</p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
