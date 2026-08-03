import { Headset } from 'lucide-react'

export default function Atendimentos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Atendimentos</h1>
        <p className="text-sm text-brand-gray">Acompanhe as conversas em andamento com seus pacientes</p>
      </div>

      <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-secondary/10 text-brand-primary">
          <Headset className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-gray-900">Em breve</p>
        <p className="max-w-sm text-sm text-brand-gray">
          Em breve você poderá acompanhar todas as conversas do atendimento por IA diretamente por aqui.
        </p>
      </div>
    </div>
  )
}
