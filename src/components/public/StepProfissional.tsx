import { Loader2, User } from 'lucide-react'
import type { Profissional } from '@/types/database'

interface StepProfissionalProps {
  profissionais: Profissional[]
  loading: boolean
  onSelect: (profissional: Profissional) => void
}

export default function StepProfissional({ profissionais, loading, onSelect }: StepProfissionalProps) {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  if (profissionais.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">
        Nenhum profissional disponível para agendamento no momento.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Escolha o profissional</h2>
      <div className="space-y-2.5">
        {profissionais.map((profissional) => (
          <button
            key={profissional.id}
            onClick={() => onSelect(profissional)}
            className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{profissional.nome}</p>
              {profissional.especialidade && (
                <p className="text-sm text-gray-500">{profissional.especialidade}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
