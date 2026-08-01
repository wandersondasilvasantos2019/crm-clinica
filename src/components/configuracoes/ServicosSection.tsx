import { useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/format'
import ServicoModal from './ServicoModal'
import type { Servico } from '@/types/database'

export default function ServicosSection({ instanceId }: { instanceId: string }) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Servico | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('servicos')
      .select('*')
      .eq('instance_id', instanceId)
      .order('nome')
    setServicos(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId])

  async function handleDelete(servico: Servico) {
    if (!confirm(`Excluir o serviço "${servico.nome}"?`)) return
    await supabase.from('servicos').delete().eq('id', servico.id)
    load()
  }

  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Serviços</h2>
          <p className="text-sm text-gray-400">Serviços oferecidos pela clínica</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Novo serviço
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Duração</th>
                <th className="px-3 py-2 font-medium">Valor</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {servicos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                    Nenhum serviço cadastrado.
                  </td>
                </tr>
              ) : (
                servicos.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="px-3 py-2.5 text-gray-900">{s.nome}</td>
                    <td className="px-3 py-2.5 text-gray-500">{s.duracao_minutos} min</td>
                    <td className="px-3 py-2.5 text-gray-500">{formatCurrency(Number(s.valor))}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`badge ${
                          s.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                          onClick={() => {
                            setEditing(s)
                            setModalOpen(true)
                          }}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(s)}
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

      <ServicoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        instanceId={instanceId}
        servico={editing}
      />
    </section>
  )
}
