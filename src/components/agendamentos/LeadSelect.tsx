import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPhone } from '@/lib/format'
import type { LeadPaciente } from '@/types/database'

interface LeadSelectProps {
  instanceId: string
  value: string
  onChange: (leadId: string) => void
}

export default function LeadSelect({ instanceId, value, onChange }: LeadSelectProps) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<LeadPaciente[]>([])

  useEffect(() => {
    const timeout = setTimeout(async () => {
      let request = supabase
        .from('leads_pacientes')
        .select('*')
        .eq('instance_id', instanceId)
        .order('nome', { ascending: true })
        .limit(20)

      if (query.trim()) {
        request = request.or(`nome.ilike.%${query}%,telefone.ilike.%${query}%`)
      }

      const { data } = await request
      setOptions(data ?? [])
    }, 250)

    return () => clearTimeout(timeout)
  }, [instanceId, query])

  return (
    <div className="space-y-2">
      <input
        className="input"
        placeholder="Buscar paciente por nome ou telefone"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        size={Math.min(6, Math.max(3, options.length))}
      >
        <option value="" disabled className="bg-gray-50">
          Selecione um paciente
        </option>
        {options.map((lead) => (
          <option key={lead.id} value={lead.id} className="bg-gray-50">
            {lead.nome || 'Sem nome'} · {formatPhone(lead.telefone)}
          </option>
        ))}
      </select>
    </div>
  )
}
