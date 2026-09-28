import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { ConfigCliente } from '@/types/database'
import { useAuth } from './AuthContext'

interface InstanceContextValue {
  instances: ConfigCliente[]
  instanceId: string | null
  setInstanceId: (id: string) => void
  loading: boolean
  refreshInstances: () => Promise<void>
}

const InstanceContext = createContext<InstanceContextValue | undefined>(undefined)

const STORAGE_KEY = 'crm.instanceId'

export function InstanceProvider({ children }: { children: ReactNode }) {
  const { user, role, ownInstanceId, roleLoading } = useAuth()
  const userId = user?.id ?? null
  const [instances, setInstances] = useState<ConfigCliente[]>([])
  // Começa sempre nulo: o cliente só recebe o próprio ownInstanceId e o admin
  // recupera a última escolha do localStorage dentro de refreshInstances, já
  // validada contra a lista. Ler o localStorage aqui faria um cliente disparar
  // as primeiras consultas com o tenant que um admin deixou salvo no navegador.
  const [instanceId, setInstanceIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshInstances() {
    setLoading(true)

    if (role === 'cliente') {
      const { data, error } = await supabase
        .from('config_cliente')
        .select('*')
        .eq('instance_id', ownInstanceId)

      if (!error && data) {
        setInstances(data)
        setInstanceIdState(ownInstanceId)
      }
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('config_cliente')
      .select('*')
      .order('nome_empresa', { ascending: true })

    if (!error && data) {
      setInstances(data)
      const atual = instanceId ?? localStorage.getItem(STORAGE_KEY)
      const stillValid = data.some((d) => d.instance_id === atual)
      if (stillValid) {
        setInstanceIdState(atual)
      } else if (data.length > 0) {
        setInstanceIdState(data[0].instance_id)
        localStorage.setItem(STORAGE_KEY, data[0].instance_id)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!userId) {
      // Logout: não deixa o tenant anterior vazar para o próximo login.
      setInstances([])
      setInstanceIdState(null)
      return
    }
    if (!roleLoading) {
      refreshInstances()
    }
    // Depende do id do usuário, não do objeto de sessão: o refresh do token
    // (a cada ~1h ou ao voltar para a aba) troca o objeto e não deve recarregar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, role, ownInstanceId, roleLoading])

  function setInstanceId(id: string) {
    // Cliente fica preso ao proprio tenant — sem seletor, sem-op de seguranca
    // caso algo tente trocar o instance_id mesmo assim.
    if (role === 'cliente') return
    setInstanceIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return (
    <InstanceContext.Provider
      value={{ instances, instanceId, setInstanceId, loading, refreshInstances }}
    >
      {children}
    </InstanceContext.Provider>
  )
}

export function useInstance() {
  const ctx = useContext(InstanceContext)
  if (!ctx) throw new Error('useInstance deve ser usado dentro de InstanceProvider')
  return ctx
}
