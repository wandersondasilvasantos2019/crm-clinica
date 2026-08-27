import { useState, type FormEvent } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function TrocarSenhaSection() {
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    if (novaSenha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha })
    setSaving(false)

    if (updateError) {
      setError('Não foi possível atualizar a senha. Tente novamente.')
      return
    }

    setSaved(true)
    setNovaSenha('')
    setConfirmarSenha('')
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <section className="card">
      <h2 className="mb-1 text-base font-semibold text-gray-900">Trocar senha</h2>
      <p className="mb-4 text-sm text-gray-400">Altere a senha usada para acessar sua conta.</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nova_senha">
            Nova senha
          </label>
          <input
            id="nova_senha"
            type="password"
            className="input"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="label" htmlFor="confirmar_senha">
            Confirmar nova senha
          </label>
          <input
            id="confirmar_senha"
            type="password"
            className="input"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {error && <p className="sm:col-span-2 text-sm text-rose-600">{error}</p>}

        <div className="sm:col-span-2 flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Trocar senha
          </button>
          {saved && <span className="text-sm text-brand-primary">Senha atualizada!</span>}
        </div>
      </form>
    </section>
  )
}
