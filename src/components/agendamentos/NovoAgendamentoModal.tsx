import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import LeadSelect from './LeadSelect'
import type { Profissional, Servico } from '@/types/database'

interface NovoAgendamentoModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  instanceId: string
  initialDate: Date | null
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

export default function NovoAgendamentoModal({
  open,
  onClose,
  onCreated,
  instanceId,
  initialDate,
}: NovoAgendamentoModalProps) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [leadId, setLeadId] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [dataHora, setDataHora] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLeadId('')
    setServicoId('')
    setProfissionalId('')
    setError(null)
    setDataHora(initialDate ? toLocalInputValue(initialDate) : '')

    async function loadOptions() {
      const [servicosRes, profissionaisRes] = await Promise.all([
        supabase
          .from('servicos')
          .select('*')
          .eq('instance_id', instanceId)
          .eq('ativo', true)
          .order('nome'),
        supabase.from('profissionais').select('*').eq('instance_id', instanceId).order('nome'),
      ])
      setServicos(servicosRes.data ?? [])
      setProfissionais(profissionaisRes.data ?? [])
    }

    loadOptions()
  }, [open, initialDate, instanceId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!leadId || !servicoId || !dataHora) {
      setError('Preencha paciente, serviço e data/hora.')
      return
    }
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from('agendamentos').insert({
      instance_id: instanceId,
      lead_id: leadId,
      servico_id: servicoId,
      profissional_id: profissionalId || null,
      data_hora: new Date(dataHora).toISOString(),
      status: 'confirmado',
      criado_via: 'painel_web',
    })

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    onCreated()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Paciente</label>
          <LeadSelect instanceId={instanceId} value={leadId} onChange={setLeadId} />
        </div>

        <div>
          <label className="label" htmlFor="servico">
            Serviço
          </label>
          <select
            id="servico"
            className="input"
            value={servicoId}
            onChange={(e) => setServicoId(e.target.value)}
            required
          >
            <option value="" disabled className="bg-gray-50">
              Selecione um serviço
            </option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id} className="bg-gray-50">
                {s.nome} ({s.duracao_minutos}min)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="profissional">
            Profissional
          </label>
          <select
            id="profissional"
            className="input"
            value={profissionalId}
            onChange={(e) => setProfissionalId(e.target.value)}
          >
            <option value="" className="bg-gray-50">
              Sem preferência
            </option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id} className="bg-gray-50">
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="data_hora">
            Data e hora
          </label>
          <input
            id="data_hora"
            type="datetime-local"
            className="input"
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
            required
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar agendamento
          </button>
        </div>
      </form>
    </Modal>
  )
}
