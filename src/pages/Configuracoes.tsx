import { useInstance } from '@/context/InstanceContext'
import ConfigClienteSection from '@/components/configuracoes/ConfigClienteSection'
import TrocarSenhaSection from '@/components/configuracoes/TrocarSenhaSection'
import ServicosSection from '@/components/configuracoes/ServicosSection'
import ProfissionaisSection from '@/components/configuracoes/ProfissionaisSection'
import ConectarWhatsappSection from '@/components/configuracoes/ConectarWhatsappSection'

export default function Configuracoes() {
  const { instanceId } = useInstance()

  if (!instanceId) {
    return <p className="text-sm text-gray-400">Selecione um negócio para editar as configurações.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-brand-gray">Dados do negócio, serviços e profissionais</p>
      </div>

      <ConfigClienteSection />
      <TrocarSenhaSection />
      <ConectarWhatsappSection />
      <ServicosSection instanceId={instanceId} />
      <ProfissionaisSection instanceId={instanceId} />
    </div>
  )
}
