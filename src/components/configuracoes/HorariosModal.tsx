import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import type { HorarioDisponivel, Profissional } from '@/types/database'

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

interface HorariosModalProps {
  open: boolean
  onClose: () => void
  profissional: Profissional | null
}

export default function HorariosModal({ open, onClose, profissional }: HorariosModalProps) {
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([])
  const [loading, setLoading] = useState(true)
  const [diaSemana, setDiaSemana] = useState('1')
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [horaFim, setHoraFim] = useState('18:00')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!profissional) return
    setLoading(true)
    const { data } = await supabase
      .from('horarios_disponiveis')
      .select('*')
      .eq('profissional_id', profissional.id)
      .order('dia_semana')
    setHorarios(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (open) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profissional])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!profissional) return
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from('horarios_disponiveis').insert({
      profissional_id: profissional.id,
      dia_semana: Number(diaSemana),
      hora_inicio: `${horaInicio}:00`,
      hora_fim: `${horaFim}:00`,
    })

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('horarios_disponiveis').delete().eq('id', id)
    load()
  }

  return (
    <Modal
      open={open && !!profissional}
      onClose={onClose}
      title={`Horários de ${profissional?.nome ?? ''}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
          </div>
        ) : (
          <ul className="space-y-2">
            {horarios.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum horário cadastrado.</p>
            ) : (
              horarios.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="text-gray-900">
                    {DIAS_SEMANA[h.dia_semana]} · {h.hora_inicio.slice(0, 5)} às{' '}
                    {h.hora_fim.slice(0, 5)}
                  </span>
                  <button
                    className="rounded-md p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(h.id)}
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        <form onSubmit={handleAdd} className="space-y-3 border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-700">Adicionar horário</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              className="input"
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value)}
            >
              {DIAS_SEMANA.map((label, i) => (
                <option key={label} value={i} className="bg-gray-50">
                  {label}
                </option>
              ))}
            </select>
            <input
              type="time"
              className="input"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              required
            />
            <input
              type="time"
              className="input"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button type="submit" className="btn-secondary" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </button>
        </form>
      </div>
    </Modal>
  )
}
