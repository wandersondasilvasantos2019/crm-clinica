import { Building2 } from 'lucide-react'
import { useInstance } from '@/context/InstanceContext'

export default function InstanceSwitcher() {
  const { instances, instanceId, setInstanceId, loading } = useInstance()

  if (loading) {
    return <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-50" />
  }

  if (instances.length === 0) {
    return (
      <span className="text-sm text-gray-400">Nenhuma clínica cadastrada</span>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <Building2 className="h-4 w-4 text-gray-500" />
      <select
        value={instanceId ?? ''}
        onChange={(e) => setInstanceId(e.target.value)}
        className="bg-transparent text-sm font-medium text-gray-900 outline-none"
      >
        {instances.map((inst) => (
          <option key={inst.instance_id} value={inst.instance_id} className="bg-gray-50">
            {inst.nome_empresa ?? inst.instance_id}
          </option>
        ))}
      </select>
    </div>
  )
}
