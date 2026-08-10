import { useEffect, useRef, useState } from 'react'
import { Loader2, QrCode, CheckCircle2, Power } from 'lucide-react'
import { useInstance } from '@/context/InstanceContext'

const CRIAR_SESSAO_URL = 'https://n8n.wsantos.online/webhook/waha-criar-sessao'
const STATUS_SESSAO_URL = 'https://n8n.wsantos.online/webhook/waha-status-sessao'
const ATUALIZAR_QR_URL = 'https://n8n.wsantos.online/webhook/waha-atualizar-qr'
const DESCONECTAR_URL = 'https://n8n.wsantos.online/webhook/waha-desconectar'

const POLL_INTERVAL_MS = 3000
const QR_REFRESH_SECONDS = 20

type ConnectionState = 'checking' | 'disconnected' | 'loading_qr' | 'waiting_scan' | 'connected'

async function fetchStatus(instanceId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${STATUS_SESSAO_URL}?instance_id=${encodeURIComponent(instanceId)}`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.status ?? null
  } catch {
    return null
  }
}

export default function ConectarWhatsappSection() {
  const { instanceId } = useInstance()
  const [state, setState] = useState<ConnectionState>('checking')
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_REFRESH_SECONDS)
  const [error, setError] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const qrUrlRef = useRef<string | null>(null)

  function clearPoll() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function clearCountdown() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }

  function revokeQrUrl() {
    if (qrUrlRef.current) {
      URL.revokeObjectURL(qrUrlRef.current)
      qrUrlRef.current = null
    }
  }

  async function refreshQr(id: string) {
    try {
      const res = await fetch(
        `${ATUALIZAR_QR_URL}?instance_id=${encodeURIComponent(id)}`
      )
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      revokeQrUrl()
      qrUrlRef.current = url
      setQrUrl(url)
    } catch {
      // silencioso — a proxima virada do contador tenta de novo
    }
  }

  useEffect(() => {
    // Troca de clinica (admin) ou primeira carga: limpa tudo e reavalia do zero.
    clearPoll()
    clearCountdown()
    revokeQrUrl()
    setQrUrl(null)
    setQrSecondsLeft(QR_REFRESH_SECONDS)
    setError(null)

    if (!instanceId) {
      setState('disconnected')
      return
    }

    let cancelled = false
    setState('checking')

    fetchStatus(instanceId).then((status) => {
      if (cancelled) return
      setState(status === 'WORKING' ? 'connected' : 'disconnected')
    })

    return () => {
      cancelled = true
      clearPoll()
      clearCountdown()
      revokeQrUrl()
    }
  }, [instanceId])

  async function handleConnect() {
    if (!instanceId) return
    setError(null)
    setState('loading_qr')

    try {
      const res = await fetch(CRIAR_SESSAO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: instanceId }),
      })
      if (!res.ok) throw new Error('Não foi possível gerar o QR Code.')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      revokeQrUrl()
      qrUrlRef.current = url
      setQrUrl(url)
      setQrSecondsLeft(QR_REFRESH_SECONDS)
      setState('waiting_scan')

      clearPoll()
      pollRef.current = setInterval(async () => {
        const status = await fetchStatus(instanceId)
        if (status === 'WORKING') {
          clearPoll()
          clearCountdown()
          revokeQrUrl()
          setQrUrl(null)
          setState('connected')
        } else if (status === 'FAILED' || status === 'STOPPED') {
          clearPoll()
          clearCountdown()
          revokeQrUrl()
          setQrUrl(null)
          setState('disconnected')
          setError('A sessão do WhatsApp falhou ou foi interrompida. Tente conectar novamente.')
        }
      }, POLL_INTERVAL_MS)

      // O WAHA troca o QR internamente a cada ~20s enquanto ninguem escaneia
      // — sem isso, a imagem exibida fica velha e o scan falha em silencio.
      clearCountdown()
      countdownRef.current = setInterval(() => {
        setQrSecondsLeft((prev) => {
          if (prev <= 1) {
            refreshQr(instanceId)
            return QR_REFRESH_SECONDS
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setState('disconnected')
      setError(err instanceof Error ? err.message : 'Erro ao conectar o WhatsApp.')
    }
  }

  async function handleDisconnect() {
    if (!instanceId) return
    setDisconnecting(true)
    setError(null)
    try {
      await fetch(DESCONECTAR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: instanceId }),
      })
    } catch {
      // segue pro estado desconectado mesmo assim
    }
    clearPoll()
    clearCountdown()
    revokeQrUrl()
    setQrUrl(null)
    setDisconnecting(false)
    setState('disconnected')
  }

  if (!instanceId) return null

  return (
    <section className="card">
      <h2 className="mb-1 text-base font-semibold text-gray-900">Conectar WhatsApp</h2>
      <p className="mb-4 text-sm text-gray-400">
        Conecte o número que vai atender seus clientes pelo WhatsApp.
      </p>

      {state === 'checking' && (
        <div className="flex items-center gap-2 text-sm text-brand-gray">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verificando conexão...
        </div>
      )}

      {state === 'connected' && (
        <div className="flex items-center justify-between gap-3">
          <span className="badge bg-brand-primary/10 text-brand-primary">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Conectado
          </span>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            Desconectar
          </button>
        </div>
      )}

      {(state === 'disconnected' || state === 'loading_qr') && (
        <button
          type="button"
          className="btn-primary"
          onClick={handleConnect}
          disabled={state === 'loading_qr'}
        >
          {state === 'loading_qr' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <QrCode className="h-4 w-4" />
          )}
          Conectar WhatsApp
        </button>
      )}

      {state === 'waiting_scan' && qrUrl && (
        <div className="flex flex-col items-center gap-3">
          <img
            src={qrUrl}
            alt="QR Code para conectar o WhatsApp"
            className="h-56 w-56 rounded-lg border border-gray-200 object-contain"
          />
          <p className="text-sm text-brand-gray">
            Abra o WhatsApp no celular e escaneie o QR Code.
          </p>
          <p className="text-xs text-gray-400">
            Este QR Code atualiza em {qrSecondsLeft}s
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
    </section>
  )
}
