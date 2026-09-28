import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'
import { configAlertaDoCliente, tocarTesteAlarme } from '@/lib/alertaSom'
import type { AlertaSom } from '@/types/database'

const OPCOES_SOM: { value: AlertaSom; label: string }[] = [
  { value: 'alarme', label: 'Alarme 🚨' },
  { value: 'campainha', label: 'Campainha 🔔' },
  { value: 'bipe', label: 'Bipe 📟' },
  { value: 'suave', label: 'Suave 🎵' },
]

const OPCOES_INTERVALO: { value: number; label: string }[] = [
  { value: 0, label: 'Contínuo' },
  { value: 5, label: 'A cada 5s' },
  { value: 10, label: 'A cada 10s' },
]

export default function AlertaPedidosSection() {
  const { instanceId, instances, refreshInstances } = useInstance()
  const [som, setSom] = useState<AlertaSom>('alarme')
  const [volumePct, setVolumePct] = useState(90)
  const [intervaloS, setIntervaloS] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const config = configAlertaDoCliente(instances.find((i) => i.instance_id === instanceId))
    setSom(config.som)
    setVolumePct(Math.round(config.volume * 100))
    setIntervaloS(config.intervaloS)
  }, [instanceId, instances])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!instanceId) return
    setSaving(true)
    setSaved(false)
    setError(null)

    const { error } = await supabase
      .from('config_cliente')
      .update({
        alerta_som: som,
        alerta_volume: volumePct / 100,
        alerta_intervalo_s: intervaloS,
      })
      .eq('instance_id', instanceId)

    setSaving(false)
    if (error) {
      setError('Não foi possível salvar. Tente novamente.')
      return
    }
    setSaved(true)
    await refreshInstances()
    setTimeout(() => setSaved(false), 2500)
  }

  if (!instanceId) return null

  return (
    <section className="card">
      <h2 className="mb-1 text-base font-semibold text-gray-900">Alerta de pedidos</h2>
      <p className="mb-4 text-sm text-gray-400">
        Som tocado no painel enquanto houver pedido novo aguardando aceite.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="alerta_som">
            Som
          </label>
          <select
            id="alerta_som"
            className="input"
            value={som}
            onChange={(e) => setSom(e.target.value as AlertaSom)}
          >
            {OPCOES_SOM.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="alerta_volume">
            Volume: {volumePct}%
          </label>
          <input
            id="alerta_volume"
            type="range"
            min={10}
            max={100}
            step={5}
            value={volumePct}
            onChange={(e) => setVolumePct(Number(e.target.value))}
            className="h-9 w-full accent-brand-primary"
          />
        </div>

        <div>
          <label className="label" htmlFor="alerta_intervalo">
            Intervalo entre toques
          </label>
          <select
            id="alerta_intervalo"
            className="input"
            value={intervaloS}
            onChange={(e) => setIntervaloS(Number(e.target.value))}
          >
            {OPCOES_INTERVALO.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void tocarTesteAlarme({ som, volume: volumePct / 100, intervaloS })}
          >
            🔊 Testar
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alterações
          </button>
          {saved && <span className="text-sm text-brand-primary">Salvo com sucesso.</span>}
          {error && <span className="text-sm text-rose-600">{error}</span>}
        </div>
      </form>
    </section>
  )
}
