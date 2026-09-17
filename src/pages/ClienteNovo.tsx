import { useState, type FormEvent } from 'react'
import { Loader2, Save, Copy, Check } from 'lucide-react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/slug'

interface CriarClienteResult {
  instance_id: string
  email: string
  senha_temporaria: string
}

async function extractErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (body?.error) return body.error as string
    } catch {
      // resposta nao veio em JSON — usa a mensagem generica abaixo
    }
  }
  return fallback
}

export default function ClienteNovo() {
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [horarioFuncionamento, setHorarioFuncionamento] = useState('')
  const [tomVoz, setTomVoz] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CriarClienteResult | null>(null)
  const [copied, setCopied] = useState(false)

  function handleNomeEmpresaChange(value: string) {
    setNomeEmpresa(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setSlug(slugify(value))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { data, error: invokeError } = await supabase.functions.invoke('criar-cliente', {
      body: {
        nome_empresa: nomeEmpresa,
        slug,
        horario_funcionamento: horarioFuncionamento || undefined,
        tom_voz: tomVoz || undefined,
        email,
      },
    })

    setSubmitting(false)

    if (invokeError) {
      setError(await extractErrorMessage(invokeError, invokeError.message))
      return
    }

    setResult(data as CriarClienteResult)
  }

  function handleReset() {
    setResult(null)
    setNomeEmpresa('')
    setSlug('')
    setSlugTouched(false)
    setHorarioFuncionamento('')
    setTomVoz('')
    setEmail('')
    setCopied(false)
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(
      `E-mail: ${result.email}\nSenha temporária: ${result.senha_temporaria}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cliente cadastrado</h1>
          <p className="text-sm text-brand-gray">Copie os dados abaixo e envie pro cliente.</p>
        </div>

        <div className="card space-y-3">
          <div>
            <p className="label">Negócio</p>
            <p className="text-sm font-medium text-gray-900">{result.instance_id}</p>
          </div>
          <div>
            <p className="label">E-mail</p>
            <p className="text-sm font-medium text-gray-900">{result.email}</p>
          </div>
          <div>
            <p className="label">Senha temporária</p>
            <p className="font-mono text-sm font-medium text-gray-900">
              {result.senha_temporaria}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado' : 'Copiar dados'}
            </button>
            <button type="button" className="btn-primary" onClick={handleReset}>
              Cadastrar outro cliente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cadastrar cliente</h1>
        <p className="text-sm text-brand-gray">
          Cria o negócio e o login do cliente numa única ação.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label" htmlFor="nome_empresa">
            Nome da empresa
          </label>
          <input
            id="nome_empresa"
            className="input"
            required
            value={nomeEmpresa}
            onChange={(e) => handleNomeEmpresaChange(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="slug">
            Identificador (slug)
          </label>
          <input
            id="slug"
            className="input"
            required
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400">
            Usado como instance_id — só letras minúsculas, números e hífen.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="email">
            E-mail do cliente
          </label>
          <input
            id="email"
            type="email"
            className="input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@empresa.com"
          />
        </div>

        <div>
          <label className="label" htmlFor="horario_funcionamento">
            Horário de funcionamento
          </label>
          <input
            id="horario_funcionamento"
            className="input"
            value={horarioFuncionamento}
            onChange={(e) => setHorarioFuncionamento(e.target.value)}
            placeholder="Seg a Sex, 08h às 18h"
          />
        </div>

        <div>
          <label className="label" htmlFor="tom_voz">
            Tom de voz do agente
          </label>
          <input
            id="tom_voz"
            className="input"
            value={tomVoz}
            onChange={(e) => setTomVoz(e.target.value)}
            placeholder="Formal, empático, direto..."
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Cadastrar cliente
        </button>
      </form>
    </div>
  )
}
