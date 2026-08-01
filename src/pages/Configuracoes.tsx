import { useInstance } from '@/context/InstanceContext'
import ConfigClienteSection from '@/components/configuracoes/ConfigClienteSection'
import ServicosSection from '@/components/configuracoes/ServicosSection'
import ProfissionaisSection from '@/components/configuracoes/ProfissionaisSection'

export default function Configuracoes() {
  const { instanceId } = useInstance()

  if (!instanceId) {
    return <p className="text-sm text-gray-400">Selecione uma clínica para editar as configurações.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-400">Dados da clínica, serviços e profissionais</p>
      </div>

      <ConfigClienteSection />
      <ServicosSection instanceId={instanceId} />
      <ProfissionaisSection instanceId={instanceId} />
    </div>
  )
}
