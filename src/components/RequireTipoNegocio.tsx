import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useInstance } from '@/context/InstanceContext'
import type { TipoNegocio } from '@/types/database'

/**
 * Libera a rota só para negócios da vertical indicada — o menu já esconde as
 * telas da outra vertical, isto cobre o acesso direto pela URL. Quem não é da
 * vertical volta para o Dashboard (inclusive o admin ao trocar de negócio).
 */
export default function RequireTipoNegocio({ tipo, children }: { tipo: TipoNegocio; children: ReactNode }) {
  const { instances, instanceId, loading } = useInstance()
  const cliente = instances.find((i) => i.instance_id === instanceId)

  if (!cliente) {
    // Enquanto o negócio carrega, não monta a página (nem dispara as consultas
    // dela) antes de saber a vertical. Sem negócio selecionado, a própria página
    // mostra "Selecione um negócio".
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      )
    }
    return <>{children}</>
  }

  if (cliente.tipo_negocio !== tipo) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
