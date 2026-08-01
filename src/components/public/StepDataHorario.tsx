import { useEffect, useState } from 'react'
import { Loader2, CalendarX } from 'lucide-react'
import clsx from 'clsx'
import { supabasePublic } from '@/lib/supabasePublic'
import {
  buildTimeSlots,
  filterAvailableSlots,
  getNext14Days,
  isDayEnabled,
  minutesFromDate,
  type OcupacaoExistente,
} from '@/lib/slots'
import type { HorarioDisponivel } from '@/types/database'

interface StepDataHorarioProps {
  instanceId: string
  profissionalId: string
  duracaoMinutos: number
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
  onSelectSlot: (slot: string) => void
}

const DIAS_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function StepDataHorario({
  instanceId,
  profissionalId,
  duracaoMinutos,
  selectedDate,
  onSelectDate,
  onSelectSlot,
}: StepDataHorarioProps) {
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([])
  const [loadingHorarios, setLoadingHorarios] = useState(true)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const dias = getNext14Days()

  useEffect(() => {
    let cancelled = false
    setLoadingHorarios(true)
    supabasePublic
      .from('horarios_disponiveis')
      .select('*')
      .eq('profissional_id', profissionalId)
      .then(({ data }) => {
        if (cancelled) return
        setHorarios(data ?? [])
        setLoadingHorarios(false)
      })
    return () => {
      cancelled = true
    }
  }, [profissionalId])

  useEffect(() => {
    if (!selectedDate || loadingHorarios) return
    let cancelled = false

    async function loadSlots() {
      setLoadingSlots(true)
      const horariosDoDia = horarios.filter((h) => h.dia_semana === selectedDate!.getDay())
      const candidateSlots = buildTimeSlots(horariosDoDia, duracaoMinutos)

      if (candidateSlots.length === 0) {
        if (!cancelled) {
          setSlots([])
          setLoadingSlots(false)
        }
        return
      }

      const dayStart = new Date(selectedDate!)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const { data } = await supabasePublic
        .from('agendamentos')
        .select('data_hora, servico:servicos(duracao_minutos)')
        .eq('instance_id', instanceId)
        .eq('profissional_id', profissionalId)
        .neq('status', 'cancelado')
        .gte('data_hora', dayStart.toISOString())
        .lt('data_hora', dayEnd.toISOString())

      if (cancelled) return

      const ocupacoes: OcupacaoExistente[] = (data ?? []).map((row: any) => ({
        inicioMinutos: minutesFromDate(new Date(row.data_hora)),
        duracaoMinutos: row.servico?.duracao_minutos ?? 30,
      }))

      setSlots(filterAvailableSlots(candidateSlots, duracaoMinutos, ocupacoes, selectedDate!))
      setLoadingSlots(false)
    }

    loadSlots()
    return () => {
      cancelled = true
    }
  }, [selectedDate, horarios, loadingHorarios, instanceId, profissionalId, duracaoMinutos])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-3 text-base font-semibold text-gray-900">Escolha a data</h2>
        {loadingHorarios ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--color-primary)' }} />
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dias.map((dia) => {
              const enabled = isDayEnabled(dia, horarios)
              const isSelected = selectedDate?.toDateString() === dia.toDateString()
              return (
                <button
                  key={dia.toISOString()}
                  disabled={!enabled}
                  onClick={() => onSelectDate(dia)}
                  className={clsx(
                    'flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-xl border py-2 text-sm transition',
                    !enabled && 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300',
                    enabled && !isSelected && 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                    isSelected && 'border-transparent text-white'
                  )}
                  style={isSelected ? { backgroundColor: 'var(--color-primary)' } : undefined}
                >
                  <span className="text-[11px] uppercase">{DIAS_ABREV[dia.getDay()]}</span>
                  <span className="font-semibold">{dia.getDate()}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedDate && !loadingHorarios && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Escolha o horário</h2>
          {loadingSlots ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-gray-500">
              <CalendarX className="h-6 w-6 text-gray-300" />
              Nenhum horário disponível neste dia.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => onSelectSlot(slot)}
                  className="rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:shadow-md active:scale-[0.97]"
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
