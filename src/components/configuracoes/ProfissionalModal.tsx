import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import type { Profissional } from '@/types/database'

interface ProfissionalModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  instanceId: string
  profissional: Profissional | null
}

export default function ProfissionalModal({
  open,
  onClose,
  onSaved,
  instanceId,
  profissional,
}: ProfissionalModalProps) {
  const [nome, setNome] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setNome(profissional?.nome ?? '')
    setEspecialidade(profissional?.especialidade ?? '')
    setError(null)
  }, [open, profissional])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = { instance_id: instanceId, nome, especialidade }

    const { error: saveError } = profissional
      ? await supabase.from('profissionais').update(payload).eq('id', profissional.id)
      : await supabase.from('profissionais').insert(payload)

    setSubmitting(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={profissional ? 'Editar profissional' : 'Novo profissional'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="nome_prof">
            Nome
          </label>
          <input
            id="nome_prof"
            className="input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="especialidade">
            Especialidade
          </label>
          <input
            id="especialidade"
            className="input"
            value={especialidade}
            onChange={(e) => setEspecialidade(e.target.value)}
          />
        </div>

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
