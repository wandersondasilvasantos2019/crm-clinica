import { useInstance } from '@/context/InstanceContext'
import ConfigClienteSection from '@/components/configuracoes/ConfigClienteSection'
import TrocarSenhaSection from '@/components/configuracoes/TrocarSenhaSection'
import ServicosSection from '@/components/configuracoes/ServicosSection'
import ProfissionaisSection from '@/components/configuracoes/ProfissionaisSection'
import ConectarWhatsappSection from '@/components/configuracoes/ConectarWhatsappSection'
import AlertaPedidosSection from '@/components/configuracoes/AlertaPedidosSection'
import EntregaPagamentoSection from '@/components/configuracoes/EntregaPagamentoSection'

export default function Configuracoes() {
  const { instances, instanceId } = useInstance()
  const tipoNegocio = instances.find((i) => i.instance_id === instanceId)?.tipo_negocio
  const isPedidos = tipoNegocio === 'pedidos'

  if (!instanceId) {
    return <p className="text-sm text-gray-400">Selecione um negócio para editar as configurações.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-brand-gray">
          {isPedidos ? 'Dados do negócio e integrações' : 'Dados do negócio, serviços e profissionais'}
        </p>
      </div>

      <ConfigClienteSection />
      {isPedidos && <EntregaPagamentoSection />}
      {isPedidos && <AlertaPedidosSection />}
      <TrocarSenhaSection />
      <ConectarWhatsappSection />
      {!isPedidos && <ServicosSection instanceId={instanceId} />}
      {!isPedidos && <ProfissionaisSection instanceId={instanceId} />}
    </div>
  )
}
