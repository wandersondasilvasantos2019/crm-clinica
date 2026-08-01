import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'

export default function ConfigClienteSection() {
  const { instanceId, instances, refreshInstances } = useInstance()
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [horarioFuncionamento, setHorarioFuncionamento] = useState('')
  const [tomVoz, setTomVoz] = useState('')
  const [numeroHumano, setNumeroHumano] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const current = instances.find((i) => i.instance_id === instanceId)
    setNomeEmpresa(current?.nome_empresa ?? '')
    setHorarioFuncionamento(current?.horario_funcionamento ?? '')
    setTomVoz(current?.tom_voz ?? '')
    setNumeroHumano(current?.numero_humano ?? '')
  }, [instanceId, instances])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!instanceId) return
    setSaving(true)
    setSaved(false)

    const { error } = await supabase
      .from('config_cliente')
      .update({
        nome_empresa: nomeEmpresa,
        horario_funcionamento: horarioFuncionamento,
        tom_voz: tomVoz,
        numero_humano: numeroHumano,
      })
      .eq('instance_id', instanceId)

    setSaving(false)
    if (!error) {
      setSaved(true)
      await refreshInstances()
      setTimeout(() => setSaved(false), 2500)
    }
  }

  if (!instanceId) return null

  return (
    <section className="card">
      <h2 className="mb-1 text-base font-semibold text-gray-900">Dados da clínica</h2>
      <p className="mb-4 text-sm text-gray-400">
        Essas informações são usadas pelo agente de IA no WhatsApp.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nome_empresa">
            Nome da empresa
          </label>
          <input
            id="nome_empresa"
            className="input"
            value={nomeEmpresa}
            onChange={(e) => setNomeEmpresa(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="numero_humano">
            Número de transbordo humano
          </label>
          <input
            id="numero_humano"
            className="input"
            value={numeroHumano}
            onChange={(e) => setNumeroHumano(e.target.value)}
            placeholder="5511999999999"
          />
        </div>

        <div>
          <label className="label" htmlFor="horario_funcionamento">
            Horário de funcionamento
          </label>
          <input
            id="horario_funcionamento"
            className="input"
            value={horarioFuncionamento}
            onChange={(e) => setHorarioFuncionamento(e.target.value)}
            placeholder="Seg a Sex, 08h às 18h"
          />
        </div>

        <div>
          <label className="label" htmlFor="tom_voz">
            Tom de voz do agente
          </label>
          <input
            id="tom_voz"
            className="input"
            value={tomVoz}
            onChange={(e) => setTomVoz(e.target.value)}
            placeholder="Formal, empático, direto..."
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alterações
          </button>
          {saved && <span className="text-sm text-emerald-400">Salvo com sucesso.</span>}
        </div>
      </form>
    </section>
  )
}
