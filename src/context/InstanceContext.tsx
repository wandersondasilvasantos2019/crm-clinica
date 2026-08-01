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
  const { session } = useAuth()
  const [instances, setInstances] = useState<ConfigCliente[]>([])
  const [instanceId, setInstanceIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  )
  const [loading, setLoading] = useState(true)

  async function refreshInstances() {
    setLoading(true)
    const { data, error } = await supabase
      .from('config_cliente')
      .select('*')
      .order('nome_empresa', { ascending: true })

    if (!error && data) {
      setInstances(data)
      const stillValid = data.some((d) => d.instance_id === instanceId)
      if ((!instanceId || !stillValid) && data.length > 0) {
        setInstanceIdState(data[0].instance_id)
        localStorage.setItem(STORAGE_KEY, data[0].instance_id)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    if (session) {
      refreshInstances()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  function setInstanceId(id: string) {
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
