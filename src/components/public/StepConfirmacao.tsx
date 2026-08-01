import { useState, type FormEvent } from 'react'
import { CalendarDays, Clock, Stethoscope, User } from 'lucide-react'
import { supabasePublic } from '@/lib/supabasePublic'
import { capitalizeFirst, formatCurrency } from '@/lib/format'
import { isValidPhoneInput, maskPhoneInput, normalizePhoneForStorage } from '@/lib/phone'
import { combineDateAndTime, minutesFromDate } from '@/lib/slots'
import PrimaryButton from './PrimaryButton'
import type { Profissional, Servico } from '@/types/database'

interface StepConfirmacaoProps {
  instanceId: string
  servico: Servico
  profissional: Profissional
  date: Date
  slot: string
  leadId: string | null
  initialNome: string
  initialTelefoneMasked: string
  onBack: () => void
  onConfirmed: (info: { nome: string; dataHora: Date }) => void
  onSlotTaken: () => void
}

export default function StepConfirmacao({
  instanceId,
  servico,
  profissional,
  date,
  slot,
  leadId,
  initialNome,
  initialTelefoneMasked,
  onBack,
  onConfirmed,
  onSlotTaken,
}: StepConfirmacaoProps) {
  const [nome, setNome] = useState(initialNome)
  const [telefone, setTelefone] = useState(initialTelefoneMasked)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dataFormatada = capitalizeFirst(
    new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(date)
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!nome.trim()) {
      setError('Informe seu nome completo.')
      return
    }
    if (!isValidPhoneInput(telefone)) {
      setError('Informe um telefone válido com DDD.')
      return
    }

    setSubmitting(true)
    setError(null)

    const dataHora = combineDateAndTime(date, slot)
    const telefoneNormalizado = normalizePhoneForStorage(telefone)

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const { data: existentes } = await supabasePublic
      .from('agendamentos')
      .select('data_hora, servico:servicos(duracao_minutos)')
      .eq('instance_id', instanceId)
      .eq('profissional_id', profissional.id)
      .neq('status', 'cancelado')
      .gte('data_hora', dayStart.toISOString())
      .lt('data_hora', dayEnd.toISOString())

    const slotStart = minutesFromDate(dataHora)
    const slotEnd = slotStart + servico.duracao_minutos

    const colide = (existentes ?? []).some((row: any) => {
      const inicio = minutesFromDate(new Date(row.data_hora))
      const duracao = row.servico?.duracao_minutos ?? 30
      return slotStart < inicio + duracao && inicio < slotEnd
    })

    if (colide) {
      setSubmitting(false)
      onSlotTaken()
      return
    }

    let resolvedLeadId = leadId

    if (resolvedLeadId) {
      await supabasePublic
        .from('leads_pacientes')
        .update({ nome, telefone: telefoneNormalizado })
        .eq('id', resolvedLeadId)
    } else {
      const { data: leadRow, error: leadError } = await supabasePublic
        .from('leads_pacientes')
        .upsert(
          { instance_id: instanceId, telefone: telefoneNormalizado, nome, status: 'novo_lead' },
          { onConflict: 'instance_id,telefone' }
        )
        .select()
        .single()

      if (leadError || !leadRow) {
        setSubmitting(false)
        setError('Não foi possível salvar seus dados. Tente novamente.')
        return
      }
      resolvedLeadId = leadRow.id
    }

    const { error: agendamentoError } = await supabasePublic.from('agendamentos').insert({
      instance_id: instanceId,
      lead_id: resolvedLeadId,
      servico_id: servico.id,
      profissional_id: profissional.id,
      data_hora: dataHora.toISOString(),
      status: 'confirmado',
      criado_via: 'cliente_link',
    })

    if (agendamentoError) {
      setSubmitting(false)
      setError('Não foi possível confirmar o agendamento. Tente novamente.')
      return
    }

    await supabasePublic.from('leads_pacientes').update({ status: 'agendado' }).eq('id', resolvedLeadId)

    setSubmitting(false)
    onConfirmed({ nome, dataHora })
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-900">Confirme seus dados</h2>

      <div className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2.5 text-sm text-gray-700">
          <Stethoscope className="h-4 w-4 text-gray-400" />
          {servico.nome}
        </div>
        <div className="flex items-center gap-2.5 text-sm text-gray-700">
          <User className="h-4 w-4 text-gray-400" />
          {profissional.nome}
        </div>
        <div className="flex items-center gap-2.5 text-sm text-gray-700">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          {dataFormatada}
        </div>
        <div className="flex items-center gap-2.5 text-sm text-gray-700">
          <Clock className="h-4 w-4 text-gray-400" />
          {slot}
        </div>
        <div className="mt-1 border-t border-gray-100 pt-2 text-right text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
          {formatCurrency(Number(servico.valor))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="nome">
            Nome completo
          </label>
          <input
            id="nome"
            className="input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="telefone">
            WhatsApp
          </label>
          <input
            id="telefone"
            className="input"
            value={telefone}
            onChange={(e) => setTelefone(maskPhoneInput(e.target.value))}
            placeholder="(11) 91234-5678"
            inputMode="numeric"
            required
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-secondary" onClick={onBack} disabled={submitting}>
            Voltar
          </button>
          <PrimaryButton type="submit" loading={submitting} className="flex-1">
            Confirmar Agendamento
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}
