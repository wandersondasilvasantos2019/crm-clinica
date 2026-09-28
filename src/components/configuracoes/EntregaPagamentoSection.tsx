import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'

/** Endereço, taxa de entrega e formas de pagamento do restaurante (vertical de pedidos). */
export default function EntregaPagamentoSection() {
  const { instanceId, instances, refreshInstances } = useInstance()
  const [endereco, setEndereco] = useState('')
  const [taxaPorKm, setTaxaPorKm] = useState('')
  const [formasPagamento, setFormasPagamento] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Preenche o formulário uma vez por negócio: o refreshInstances() disparado ao
  // salvar outra seção não pode apagar o que ainda não foi salvo aqui.
  const carregadoParaRef = useRef<string | null>(null)

  useEffect(() => {
    const current = instances.find((i) => i.instance_id === instanceId)
    if (!current || carregadoParaRef.current === instanceId) return
    carregadoParaRef.current = instanceId
    setEndereco(current.endereco ?? '')
    setTaxaPorKm(current.taxa_entrega_por_km == null ? '' : String(current.taxa_entrega_por_km))
    setFormasPagamento(current.formas_pagamento ?? '')
  }, [instanceId, instances])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!instanceId) return
    setError(null)
    setSaved(false)

    const taxa = taxaPorKm.trim() === '' ? null : Number(taxaPorKm.replace(',', '.'))
    if (taxa !== null && (!Number.isFinite(taxa) || taxa < 0)) {
      setError('Informe uma taxa por km válida (0 ou maior).')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from('config_cliente')
      .update({
        endereco: endereco.trim() || null,
        taxa_entrega_por_km: taxa,
        formas_pagamento: formasPagamento.trim() || null,
      })
      .eq('instance_id', instanceId)
    setSaving(false)

    if (updateError) {
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
      <h2 className="mb-1 text-base font-semibold text-gray-900">Entrega e pagamento</h2>
      <p className="mb-4 text-sm text-gray-400">
        Usados pelo agente de IA para calcular a entrega e informar como pagar.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="endereco">
            Endereço do restaurante
          </label>
          <input
            id="endereco"
            className="input"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Rua, número, bairro, cidade"
          />
        </div>

        <div>
          <label className="label" htmlFor="taxa_entrega_por_km">
            Taxa de entrega por km (R$)
          </label>
          <input
            id="taxa_entrega_por_km"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className="input"
            value={taxaPorKm}
            onChange={(e) => setTaxaPorKm(e.target.value)}
            placeholder="Ex.: 2.50"
          />
        </div>

        <div>
          <label className="label" htmlFor="formas_pagamento">
            Formas de pagamento
          </label>
          <input
            id="formas_pagamento"
            className="input"
            value={formasPagamento}
            onChange={(e) => setFormasPagamento(e.target.value)}
            placeholder="Pix, cartão na entrega, dinheiro"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
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
