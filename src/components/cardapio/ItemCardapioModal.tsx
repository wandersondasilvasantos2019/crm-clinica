import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import type { ItemCardapio } from '@/types/database'

interface ItemCardapioModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  instanceId: string
  item: ItemCardapio | null
}

export default function ItemCardapioModal({ open, onClose, onSaved, instanceId, item }: ItemCardapioModalProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [preco, setPreco] = useState('0')
  const [ativo, setAtivo] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setNome(item?.nome ?? '')
    setDescricao(item?.descricao ?? '')
    setCategoria(item?.categoria ?? '')
    setPreco(String(item?.preco ?? 0))
    setAtivo(item?.ativo ?? true)
    setError(null)
  }, [open, item])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      instance_id: instanceId,
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      categoria: categoria.trim() || null,
      preco: Number(preco),
      ativo,
    }

    const { error: saveError } = item
      ? await supabase
          .from('itens_cardapio')
          .update(payload)
          .eq('id', item.id)
          .eq('instance_id', instanceId)
      : await supabase.from('itens_cardapio').insert(payload)

    setSubmitting(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? 'Editar item' : 'Novo item'}>
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
            Descrição <span className="font-normal text-gray-400">(opcional)</span>
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
            <label className="label" htmlFor="categoria">
              Categoria
            </label>
            <input
              id="categoria"
              className="input"
              placeholder="Ex.: Carnes, Bebidas"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="preco">
              Preço (R$)
            </label>
            <input
              id="preco"
              type="number"
              min={0}
              step="0.01"
              className="input"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
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
          Item ativo
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
