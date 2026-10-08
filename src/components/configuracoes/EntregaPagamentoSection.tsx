import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'
import type { EntregaModo } from '@/types/database'

/** Endereço, taxa de entrega e formas de pagamento do restaurante (vertical de pedidos). */
export default function EntregaPagamentoSection() {
  const { instanceId, instances, refreshInstances } = useInstance()
  const [endereco, setEndereco] = useState('')
  const [taxaPorKm, setTaxaPorKm] = useState('')
  const [modo, setModo] = useState<EntregaModo>('por_km')
  const [taxaFixa, setTaxaFixa] = useState('')
  const [maxKm, setMaxKm] = useState('')
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
    setModo(current.entrega_modo === 'fixa' ? 'fixa' : 'por_km')
    setTaxaFixa(current.taxa_entrega_fixa == null ? '' : String(current.taxa_entrega_fixa))
    setMaxKm(current.entrega_max_km == null ? '' : String(current.entrega_max_km))
    setFormasPagamento(current.formas_pagamento ?? '')
  }, [instanceId, instances])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!instanceId) return
    setError(null)
    setSaved(false)

    // Valida só o campo do modo ativo; o outro fica como está no banco.
    let taxa: number | null = null
    let fixa: number | null = null
    if (modo === 'por_km') {
      taxa = taxaPorKm.trim() === '' ? null : Number(taxaPorKm.replace(',', '.'))
      if (taxa !== null && (!Number.isFinite(taxa) || taxa < 0)) {
        setError('Informe uma taxa por km válida (0 ou maior).')
        return
      }
    } else {
      fixa = taxaFixa.trim() === '' ? null : Number(taxaFixa.replace(',', '.'))
      if (fixa === null || !Number.isFinite(fixa) || fixa < 0) {
        setError('Informe o valor da taxa fixa de entrega (0 ou maior).')
        return
      }
    }
    const limite = maxKm.trim() === '' ? null : Number(maxKm.replace(',', '.'))
    if (limite !== null && (!Number.isFinite(limite) || limite <= 0)) {
      setError('Informe uma distância máxima válida (maior que 0) ou deixe em branco para não limitar.')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from('config_cliente')
      .update({
        endereco: endereco.trim() || null,
        entrega_modo: modo,
        entrega_max_km: limite,
        formas_pagamento: formasPagamento.trim() || null,
        ...(modo === 'por_km' ? { taxa_entrega_por_km: taxa } : { taxa_entrega_fixa: fixa }),
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
          <label className="label" htmlFor="entrega_modo">
            Tipo de taxa de entrega
          </label>
          <select
            id="entrega_modo"
            className="input"
            value={modo}
            onChange={(e) => setModo(e.target.value as EntregaModo)}
          >
            <option value="por_km">Por km rodado</option>
            <option value="fixa">Taxa fixa (qualquer distância)</option>
          </select>
        </div>

        {modo === 'por_km' ? (
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
        ) : (
          <div>
            <label className="label" htmlFor="taxa_entrega_fixa">
              Valor da taxa fixa (R$)
            </label>
            <input
              id="taxa_entrega_fixa"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className="input"
              value={taxaFixa}
              onChange={(e) => setTaxaFixa(e.target.value)}
              placeholder="Ex.: 8.00"
            />
          </div>
        )}

        <div>
          <label className="label" htmlFor="entrega_max_km">
            Distância máxima de entrega (km)
          </label>
          <input
            id="entrega_max_km"
            type="number"
            min={0.1}
            step="0.1"
            inputMode="decimal"
            className="input"
            value={maxKm}
            onChange={(e) => setMaxKm(e.target.value)}
            placeholder="Ex.: 13 (vazio = sem limite)"
          />
          <p className="mt-1 text-xs text-gray-400">
            Acima dessa distância o agente não faz entrega e oferece retirada.
          </p>
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
