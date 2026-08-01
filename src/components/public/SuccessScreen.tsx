import { CalendarDays, CheckCircle2, Clock, Stethoscope, User } from 'lucide-react'
import { capitalizeFirst, formatCurrency } from '@/lib/format'
import type { Profissional, Servico } from '@/types/database'

interface SuccessScreenProps {
  nome: string
  servico: Servico
  profissional: Profissional
  dataHora: Date
}

export default function SuccessScreen({ nome, servico, profissional, dataHora }: SuccessScreenProps) {
  const dataFormatada = capitalizeFirst(
    new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(dataHora)
  )

  const horaFormatada = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    dataHora
  )

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <CheckCircle2 className="h-9 w-9 text-white" />
      </div>

      <h2 className="text-lg font-semibold text-gray-900">Agendamento confirmado!</h2>
      <p className="mt-1 text-sm text-gray-500">
        {nome.split(' ')[0]}, seu horário foi reservado com sucesso.
      </p>

      <div className="mt-6 w-full space-y-2 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm">
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
          {horaFormatada}
        </div>
        <div
          className="mt-1 border-t border-gray-100 pt-2 text-right text-sm font-semibold"
          style={{ color: 'var(--color-primary)' }}
        >
          {formatCurrency(Number(servico.valor))}
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">Você pode fechar esta janela.</p>
    </div>
  )
}
