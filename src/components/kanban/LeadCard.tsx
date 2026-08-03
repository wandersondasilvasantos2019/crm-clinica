import { Draggable } from '@hello-pangea/dnd'
import { Phone, Clock } from 'lucide-react'
import type { LeadPaciente } from '@/types/database'
import { formatDateTime, formatPhone } from '@/lib/format'

interface LeadCardProps {
  lead: LeadPaciente
  index: number
  onClick: () => void
}

export default function LeadCard({ lead, index, onClick }: LeadCardProps) {
  return (
    <Draggable draggableId={lead.id} index={index}>
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
          <p className="truncate text-sm font-medium text-gray-900">
            {lead.nome || 'Sem nome'}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
            <Phone className="h-3 w-3" />
            {formatPhone(lead.telefone)}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {formatDateTime(lead.atualizado_em)}
          </p>
        </div>
      )}
    </Draggable>
  )
}
