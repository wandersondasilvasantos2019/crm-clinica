import { useEffect, useState } from 'react'
import { Clock, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProfissionalModal from './ProfissionalModal'
import HorariosModal from './HorariosModal'
import type { Profissional } from '@/types/database'

export default function ProfissionaisSection({ instanceId }: { instanceId: string }) {
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Profissional | null>(null)
  const [horariosProfissional, setHorariosProfissional] = useState<Profissional | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('profissionais')
      .select('*')
      .eq('instance_id', instanceId)
      .order('nome')
    setProfissionais(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId])

  async function handleDelete(profissional: Profissional) {
    if (!confirm(`Excluir o profissional "${profissional.nome}"?`)) return
    await supabase.from('profissionais').delete().eq('id', profissional.id)
    load()
  }

  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Profissionais</h2>
          <p className="text-sm text-gray-400">Equipe e horários de disponibilidade</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Novo profissional
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
        </div>
      ) : profissionais.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Nenhum profissional cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {profissionais.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{p.nome}</p>
                <p className="text-xs text-gray-400">{p.especialidade || 'Sem especialidade'}</p>
              </div>
              <div className="flex gap-1">
                <button
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  onClick={() => setHorariosProfissional(p)}
                  aria-label="Horários"
                  title="Gerenciar horários"
                >
                  <Clock className="h-4 w-4" />
                </button>
                <button
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  onClick={() => {
                    setEditing(p)
                    setModalOpen(true)
                  }}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDelete(p)}
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ProfissionalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        instanceId={instanceId}
        profissional={editing}
      />

      <HorariosModal
        open={!!horariosProfissional}
        onClose={() => setHorariosProfissional(null)}
        profissional={horariosProfissional}
      />
    </section>
  )
}
