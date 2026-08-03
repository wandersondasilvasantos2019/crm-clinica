import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import type { Servico } from '@/types/database'

interface ServicoModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  instanceId: string
  servico: Servico | null
}

export default function ServicoModal({ open, onClose, onSaved, instanceId, servico }: ServicoModalProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [duracao, setDuracao] = useState('30')
  const [valor, setValor] = useState('0')
  const [ativo, setAtivo] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setNome(servico?.nome ?? '')
    setDescricao(servico?.descricao ?? '')
    setDuracao(String(servico?.duracao_minutos ?? 30))
    setValor(String(servico?.valor ?? 0))
    setAtivo(servico?.ativo ?? true)
    setError(null)
  }, [open, servico])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      instance_id: instanceId,
      nome,
      descricao,
      duracao_minutos: Number(duracao),
      valor: Number(valor),
      ativo,
    }

    const { error: saveError } = servico
      ? await supabase.from('servicos').update(payload).eq('id', servico.id)
      : await supabase.from('servicos').insert(payload)

    setSubmitting(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={servico ? 'Editar serviço' : 'Novo serviço'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="nome">
            Nome
          </label>
          <input
            id="nome"
            className="input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="descricao">
            Descrição
          </label>
          <textarea
            id="descricao"
            className="input"
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="duracao">
              Duração (min)
            </label>
            <input
              id="duracao"
              type="number"
              min={1}
              className="input"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="valor">
              Valor (R$)
            </label>
            <input
              id="valor"
              type="number"
              min={0}
              step="0.01"
              className="input"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-4 w-4 rounded border-gray-200 bg-gray-50 text-brand-primary"
          />
          Serviço ativo
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  )
}
