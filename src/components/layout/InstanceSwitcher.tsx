import { Bell, Building2, ChevronDown } from 'lucide-react'
import { useInstance } from '@/context/InstanceContext'

export default function InstanceSwitcher() {
  const { instances, instanceId, setInstanceId, loading } = useInstance()

  return (
    <div className="flex items-center gap-3">
      {loading ? (
        <div className="h-9 w-48 animate-pulse rounded-lg bg-white" />
      ) : instances.length === 0 ? (
        <span className="text-sm text-brand-gray">Nenhuma clínica cadastrada</span>
      ) : (
        <div className="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
          <Building2 className="h-4 w-4 text-brand-gray" />
          <select
            value={instanceId ?? ''}
            onChange={(e) => setInstanceId(e.target.value)}
            className="appearance-none bg-transparent pr-5 text-sm font-medium text-gray-900 outline-none"
          >
            {instances.map((inst) => (
              <option key={inst.instance_id} value={inst.instance_id}>
                {inst.nome_empresa ?? inst.instance_id}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-brand-gray" />
        </div>
      )}

      <button
        type="button"
        className="rounded-lg border border-gray-200 bg-white p-2.5 text-brand-gray transition hover:text-brand-primary"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" />
      </button>
    </div>
  )
}
