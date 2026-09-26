import { useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'
import { formatCurrency } from '@/lib/format'
import { AtivoBadge } from '@/components/ui/PedidoBadges'
import ItemCardapioModal from '@/components/cardapio/ItemCardapioModal'
import type { ItemCardapio } from '@/types/database'

export default function Cardapio() {
  const { instanceId } = useInstance()
  const [itens, setItens] = useState<ItemCardapio[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ItemCardapio | null>(null)

  async function load() {
    if (!instanceId) return
    setLoading(true)
    const { data } = await supabase
      .from('itens_cardapio')
      .select('*')
      .eq('instance_id', instanceId)
      .order('categoria', { nullsFirst: false })
      .order('nome')
    setItens(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId])

  async function handleDelete(item: ItemCardapio) {
    if (!instanceId) return
    if (!confirm(`Excluir o item "${item.nome}"?`)) return
    await supabase.from('itens_cardapio').delete().eq('id', item.id).eq('instance_id', instanceId)
    load()
  }

  if (!instanceId) {
    return <p className="text-sm text-gray-400">Selecione um negócio para visualizar o cardápio.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cardápio</h1>
        <p className="text-sm text-brand-gray">Itens oferecidos pelo negócio</p>
      </div>

      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Itens do cardápio</h2>
            <p className="text-sm text-gray-400">Itens inativos não são oferecidos pela IA</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Novo item
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">Categoria</th>
                  <th className="px-3 py-2 font-medium">Preço</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                      Nenhum item cadastrado.
                    </td>
                  </tr>
                ) : (
                  itens.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="px-3 py-2.5">
                        <p className="text-gray-900">{item.nome}</p>
                        {item.descricao && (
                          <p className="max-w-xs truncate text-xs text-gray-400">{item.descricao}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">{item.categoria || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-500">{formatCurrency(Number(item.preco))}</td>
                      <td className="px-3 py-2.5">
                        <AtivoBadge ativo={item.ativo} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1">
                          <button
                            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => {
                              setEditing(item)
                              setModalOpen(true)
                            }}
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(item)}
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ItemCardapioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        instanceId={instanceId}
        item={editing}
      />
    </div>
  )
}
