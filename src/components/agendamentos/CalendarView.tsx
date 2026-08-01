import { Calendar, dateFnsLocalizer, type SlotInfo } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { AgendamentoDetalhado } from '@/types/database'

const locales = { 'pt-BR': ptBR }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
})

const STATUS_COLOR: Record<string, string> = {
  confirmado: '#10b981',
  cancelado: '#f43f5e',
  realizado: '#0ea5e9',
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: AgendamentoDetalhado
}

interface CalendarViewProps {
  agendamentos: AgendamentoDetalhado[]
  onSelectSlot: (date: Date) => void
  onSelectEvent: (agendamento: AgendamentoDetalhado) => void
}

export default function CalendarView({
  agendamentos,
  onSelectSlot,
  onSelectEvent,
}: CalendarViewProps) {
  const events: CalendarEvent[] = agendamentos.map((a) => {
    const start = new Date(a.data_hora)
    const duracao = a.servico?.duracao_minutos ?? 30
    const end = new Date(start.getTime() + duracao * 60 * 1000)
    return {
      id: a.id,
      title: `${a.lead?.nome ?? 'Paciente'} · ${a.servico?.nome ?? ''}`,
      start,
      end,
      resource: a,
    }
  })

  return (
    <div className="card" style={{ height: 640 }}>
      <Calendar
        localizer={localizer}
        culture="pt-BR"
        events={events}
        defaultView="week"
        views={['week', 'day', 'agenda']}
        selectable
        onSelectSlot={(slot: SlotInfo) => onSelectSlot(slot.start)}
        onSelectEvent={(event: CalendarEvent) => onSelectEvent(event.resource)}
        eventPropGetter={(event: CalendarEvent) => ({
          style: {
            backgroundColor: STATUS_COLOR[event.resource.status] ?? '#10b981',
            borderRadius: 6,
            border: 'none',
            fontSize: 12,
          },
        })}
        messages={{
          week: 'Semana',
          day: 'Dia',
          agenda: 'Agenda',
          today: 'Hoje',
          previous: 'Anterior',
          next: 'Próxima',
          noEventsInRange: 'Nenhum agendamento neste período.',
          date: 'Data',
          time: 'Hora',
          event: 'Evento',
        }}
        style={{ height: '100%' }}
      />
    </div>
  )
}
