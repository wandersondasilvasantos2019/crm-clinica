import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BellRing, Bike, Check, Clock, Loader2, MapPin, StickyNote, Store } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'
import {
  audioLiberado,
  configAlertaDoCliente,
  desbloquearAudio,
  iniciarAlertaEmLoop,
  iniciarKeepAlive,
  onAudioStateChange,
  tocarTesteAlarme,
  type ConfigAlerta,
} from '@/lib/alertaSom'
import { formatCurrency, formatPhone, formatRelativeTime, stripWhatsappSuffix } from '@/lib/format'
import type { ItemPedido, Pedido, PedidoComItens } from '@/types/database'

const PEDIDO_SELECT = '*, itens_pedido(*)'
const TITULO_INTERVALO_MS = 1000
const TITULO_ALERTA = '🔔 NOVO PEDIDO'
// Rede de segurança caso o realtime caia sem avisar.
const RECARGA_INTERVALO_MS = 30000
// A IA costuma inserir o pedido e só depois os itens — busca os itens de novo
// um pouco depois de cada evento do realtime.
const ITENS_REFETCH_DELAYS_MS = [1500, 5000]
const SOM_ATIVADO_KEY = 'crm.alertaPedidos.somAtivado'
const NOTIFICACAO_PEDIDA_KEY = 'crm.alertaPedidos.notificacaoPedida'

function normalize(row: Pedido & { itens_pedido?: ItemPedido[] | null }): PedidoComItens {
  const itens = [...(row.itens_pedido ?? [])].sort((a, b) => a.criado_em.localeCompare(b.criado_em))
  return { ...row, itens_pedido: itens }
}

function numeroCurto(id: string) {
  return id.slice(0, 8)
}

function nomeOuTelefone(pedido: Pedido) {
  return pedido.nome_cliente || formatPhone(stripWhatsappSuffix(pedido.telefone))
}

function lerSessionFlag(key: string) {
  try {
    return sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function gravarSessionFlag(key: string) {
  try {
    sessionStorage.setItem(key, '1')
  } catch {
    // sessionStorage indisponível (aba anônima com bloqueio etc.) — segue sem lembrar.
  }
}

function pedirPermissaoNotificacao() {
  if (!('Notification' in window) || Notification.permission !== 'default') return
  try {
    if (localStorage.getItem(NOTIFICACAO_PEDIDA_KEY)) return
    localStorage.setItem(NOTIFICACAO_PEDIDA_KEY, '1')
  } catch {
    // sem storage: pede mesmo assim
  }
  void Notification.requestPermission()
}

function mostrarNotificacao(pedido: Pedido): Notification | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null
  try {
    const notificacao = new Notification(TITULO_ALERTA, {
      body: `Pedido #${numeroCurto(pedido.id)} — ${nomeOuTelefone(pedido)}`,
      tag: `pedido-${pedido.id}`,
    })
    notificacao.onclick = () => {
      window.focus()
      notificacao.close()
    }
    return notificacao
  } catch {
    // Chrome Android só aceita notificação via service worker.
    return null
  }
}

/** Monta o alerta só para negócios de pedidos — agendamento não é afetado. */
export default function AlertaPedidos() {
  const { instances, instanceId } = useInstance()
  const cliente = instances.find((i) => i.instance_id === instanceId)
  if (!instanceId || cliente?.tipo_negocio !== 'pedidos') return null
  // A config vem do config_cliente já carregado no InstanceContext; ao salvar em
  // Configurações, o refreshInstances() entrega os valores novos aqui.
  return (
    <AlertaPedidosAtivo key={instanceId} instanceId={instanceId} config={configAlertaDoCliente(cliente)} />
  )
}

function AlertaPedidosAtivo({ instanceId, config }: { instanceId: string; config: ConfigAlerta }) {
  const { pedidos, remover } = usePedidosNovos(instanceId)
  const somLiberado = useSomLiberado()
  const temPedidos = pedidos.length > 0
  const { som, volume, intervaloS } = config

  // Os ciclos ficam agendados com antecedência, então mudar a config reinicia o
  // loop (dependências primitivas: refreshInstances recria o objeto a cada carga).
  useEffect(() => {
    if (!temPedidos || !somLiberado) return
    return iniciarAlertaEmLoop({ som, volume, intervaloS })
  }, [temPedidos, somLiberado, som, volume, intervaloS])

  useEffect(() => {
    if (!somLiberado) return
    return iniciarKeepAlive()
  }, [somLiberado])

  useTituloPiscando(temPedidos)

  async function aceitar(pedido: PedidoComItens): Promise<boolean> {
    const agora = new Date().toISOString()
    // O filtro por status evita sobrescrever um pedido que outra pessoa já tratou.
    // aceito_em não vai aqui: o trigger pedidos_set_timestamps grava now() do
    // servidor em toda transição novo→confirmado (Kanban e modal inclusive).
    const { error } = await supabase
      .from('pedidos')
      .update({ status: 'confirmado', atualizado_em: agora })
      .eq('id', pedido.id)
      .eq('status', 'novo')
    if (error) return false
    remover(pedido.id)
    return true
  }

  async function recusar(pedido: PedidoComItens): Promise<boolean> {
    const agora = new Date().toISOString()
    const { error } = await supabase
      .from('pedidos')
      .update({ status: 'cancelado', atualizado_em: agora })
      .eq('id', pedido.id)
      .eq('status', 'novo')
    if (error) return false
    remover(pedido.id)
    return true
  }

  return (
    <>
      {!somLiberado && (
        <div className="flex items-stretch bg-amber-400 text-sm font-semibold text-amber-950 shadow-md">
          <button
            type="button"
            onClick={() => {
              void desbloquearAudio()
              pedirPermissaoNotificacao()
            }}
            className="flex-1 px-4 py-2.5 transition hover:bg-amber-300"
          >
            🔔 Clique aqui para ativar o som dos pedidos
          </button>
          <BotaoTestarSom
            config={config}
            className="border-l border-amber-500/50 px-4 transition hover:bg-amber-300"
          />
        </div>
      )}
      {temPedidos && (
        <ModalPedidosNovos
          pedidos={pedidos}
          config={config}
          somLiberado={somLiberado}
          onAceitar={aceitar}
          onRecusar={recusar}
        />
      )}
    </>
  )
}

/** Lista de pedidos com status 'novo' da instância, mantida em dia pelo realtime. */
function usePedidosNovos(instanceId: string) {
  const [pedidos, setPedidos] = useState<PedidoComItens[]>([])
  // Momento em que cada pedido saiu da lista, pra uma recarga que começou antes
  // disso não trazer de volta um pedido já aceito/recusado.
  const removidosEmRef = useRef(new Map<string, number>())
  const notificacoesRef = useRef(new Map<string, Notification>())
  const conhecidosRef = useRef<Set<string> | null>(null)

  const remover = useCallback((id: string) => {
    removidosEmRef.current.set(id, Date.now())
    notificacoesRef.current.get(id)?.close()
    notificacoesRef.current.delete(id)
    conhecidosRef.current?.delete(id)
    setPedidos((current) => current.filter((p) => p.id !== id))
  }, [])

  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    // A primeira carga só registra o que já existia; notificação do navegador
    // é só para pedido que chega depois.
    function registrar(lista: Pedido[]) {
      if (!conhecidosRef.current) {
        conhecidosRef.current = new Set(lista.map((p) => p.id))
        return
      }
      for (const pedido of lista) {
        if (conhecidosRef.current.has(pedido.id)) continue
        conhecidosRef.current.add(pedido.id)
        const notificacao = mostrarNotificacao(pedido)
        if (notificacao) notificacoesRef.current.set(pedido.id, notificacao)
      }
    }

    function aplicar(row: Pedido, itens?: ItemPedido[]) {
      if (row.status !== 'novo') {
        remover(row.id)
        return
      }
      removidosEmRef.current.delete(row.id)
      registrar([row])
      setPedidos((current) => {
        const existing = current.find((p) => p.id === row.id)
        const atualizado: PedidoComItens = {
          ...row,
          itens_pedido: itens ?? existing?.itens_pedido ?? [],
        }
        const lista = existing
          ? current.map((p) => (p.id === row.id ? atualizado : p))
          : [...current, atualizado]
        return lista.sort((a, b) => a.criado_em.localeCompare(b.criado_em))
      })
    }

    async function carregar() {
      const inicio = Date.now()
      const { data, error } = await supabase
        .from('pedidos')
        .select(PEDIDO_SELECT)
        .eq('instance_id', instanceId)
        .eq('status', 'novo')
        .order('criado_em', { ascending: true })
      if (cancelled || error) return
      const lista = (data ?? [])
        .map(normalize)
        .filter((p) => (removidosEmRef.current.get(p.id) ?? 0) < inicio)
      registrar(lista)
      setPedidos(lista)
    }

    async function recarregarUm(id: string) {
      const { data } = await supabase.from('pedidos').select(PEDIDO_SELECT).eq('id', id).maybeSingle()
      if (cancelled || !data) return
      const fresh = normalize(data)
      aplicar(fresh, fresh.itens_pedido)
    }

    function onMudanca(row: Pedido) {
      aplicar(row)
      if (row.status === 'novo') {
        for (const delay of ITENS_REFETCH_DELAYS_MS) {
          timers.push(setTimeout(() => recarregarUm(row.id), delay))
        }
      }
    }

    carregar()
    const recarga = setInterval(carregar, RECARGA_INTERVALO_MS)

    const filter = `instance_id=eq.${instanceId}`
    const channel = supabase
      .channel(`alerta-pedidos-${instanceId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos', filter }, (payload) =>
        onMudanca(payload.new as Pedido)
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter }, (payload) =>
        onMudanca(payload.new as Pedido)
      )
      .subscribe((status) => {
        // Ao (re)conectar, recarrega pra não perder eventos do período desconectado.
        if (status === 'SUBSCRIBED') carregar()
      })

    const notificacoes = notificacoesRef.current
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      clearInterval(recarga)
      supabase.removeChannel(channel)
      notificacoes.forEach((n) => n.close())
      notificacoes.clear()
    }
  }, [instanceId, remover])

  return { pedidos, remover }
}

/**
 * Estado do áudio. Qualquer clique/tecla na página também libera o som (não só
 * a faixa), pra que clicar em "Aceitar pedido" já conte como interação.
 */
function useSomLiberado() {
  const [liberado, setLiberado] = useState(audioLiberado)

  useEffect(() => {
    const unsubscribe = onAudioStateChange(() => {
      const ok = audioLiberado()
      setLiberado(ok)
      if (ok) gravarSessionFlag(SOM_ATIVADO_KEY)
    })

    // Já ativado nesta sessão: tenta retomar sem novo clique (alguns navegadores
    // permitem). Se não der, a faixa continua visível até a próxima interação.
    if (lerSessionFlag(SOM_ATIVADO_KEY)) void desbloquearAudio()

    function aoInteragir() {
      if (!audioLiberado()) void desbloquearAudio()
      pedirPermissaoNotificacao()
    }
    document.addEventListener('pointerdown', aoInteragir, true)
    document.addEventListener('keydown', aoInteragir, true)

    return () => {
      unsubscribe()
      document.removeEventListener('pointerdown', aoInteragir, true)
      document.removeEventListener('keydown', aoInteragir, true)
    }
  }, [])

  return liberado
}

function useTituloPiscando(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return
    const original = document.title
    let alerta = true
    document.title = TITULO_ALERTA
    const timer = setInterval(() => {
      alerta = !alerta
      document.title = alerta ? TITULO_ALERTA : original
    }, TITULO_INTERVALO_MS)
    return () => {
      clearInterval(timer)
      document.title = original
    }
  }, [ativo])
}

/** Toca 1 ciclo do alarme, pro dono ajustar o volume do computador/caixa de som. */
function BotaoTestarSom({ config, className }: { config: ConfigAlerta; className?: string }) {
  return (
    <button type="button" onClick={() => void tocarTesteAlarme(config)} className={className}>
      🔊 Testar som
    </button>
  )
}

interface ModalPedidosNovosProps {
  pedidos: PedidoComItens[]
  config: ConfigAlerta
  somLiberado: boolean
  onAceitar: (pedido: PedidoComItens) => Promise<boolean>
  onRecusar: (pedido: PedidoComItens) => Promise<boolean>
}

function ModalPedidosNovos({ pedidos, config, somLiberado, onAceitar, onRecusar }: ModalPedidosNovosProps) {
  // Re-renderiza periodicamente pra atualizar o "há X minutos".
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  // Sem onClick no fundo e sem listener de ESC: só fecha quando não sobrar pedido novo.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alerta-pedidos-titulo"
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-4 ring-emerald-400">
        <div className="flex items-center gap-3 bg-emerald-500 px-5 py-4 text-white">
          <BellRing className="h-7 w-7 animate-bounce" />
          <h2 id="alerta-pedidos-titulo" className="text-lg font-bold">
            {pedidos.length === 1 ? 'Novo pedido!' : `${pedidos.length} novos pedidos!`}
          </h2>
          <BotaoTestarSom
            config={config}
            className="ml-auto rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/25"
          />
        </div>
        {/* A faixa "ativar som" fica sob o fundo escuro do modal; qualquer toque
            aqui já libera o áudio (listener global em useSomLiberado). */}
        {!somLiberado && (
          <p className="bg-amber-100 px-5 py-2 text-sm font-medium text-amber-900">
            🔇 Som desativado — toque em qualquer lugar para ativar.
          </p>
        )}
        <div className="space-y-4 overflow-y-auto bg-brand-light p-4 sm:p-5">
          {pedidos.map((pedido) => (
            <CardPedidoNovo key={pedido.id} pedido={pedido} onAceitar={onAceitar} onRecusar={onRecusar} />
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}

interface CardPedidoNovoProps {
  pedido: PedidoComItens
  onAceitar: (pedido: PedidoComItens) => Promise<boolean>
  onRecusar: (pedido: PedidoComItens) => Promise<boolean>
}

function CardPedidoNovo({ pedido, onAceitar, onRecusar }: CardPedidoNovoProps) {
  const [acao, setAcao] = useState<'aceitar' | 'recusar' | null>(null)
  const [confirmandoRecusa, setConfirmandoRecusa] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function executar(tipo: 'aceitar' | 'recusar') {
    setAcao(tipo)
    setErro(null)
    const ok = await (tipo === 'aceitar' ? onAceitar(pedido) : onRecusar(pedido))
    // Se deu certo o card sai da lista e é desmontado.
    if (!ok) {
      setAcao(null)
      setErro('Não foi possível atualizar o pedido. Tente novamente.')
    }
  }

  const telefone = formatPhone(stripWhatsappSuffix(pedido.telefone))
  const ocupado = acao !== null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-semibold text-gray-400">#{numeroCurto(pedido.id)}</p>
          <p className="text-lg font-bold text-gray-900">{pedido.nome_cliente || telefone}</p>
          {pedido.nome_cliente && <p className="text-sm text-gray-500">{telefone}</p>}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
          <Clock className="h-3.5 w-3.5" />
          {formatRelativeTime(pedido.criado_em)}
        </span>
      </div>

      <div className="mt-3">
        {pedido.itens_pedido.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Aguardando itens do pedido…
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
            {pedido.itens_pedido.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">
                  {item.quantidade}x {item.nome_item}
                </span>
                <span className="text-gray-600">
                  {formatCurrency(Number(item.preco_unitario) * item.quantidade)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex justify-end text-base">
          <span className="text-gray-500">Total:&nbsp;</span>
          <span className="font-bold text-gray-900">{formatCurrency(Number(pedido.total))}</span>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-gray-700">
        {pedido.tipo_entrega === 'entrega' ? (
          <>
            <p className="flex items-center gap-2 font-semibold">
              <Bike className="h-4 w-4 text-gray-500" /> Entrega
            </p>
            {pedido.endereco_entrega && (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                {pedido.endereco_entrega}
              </p>
            )}
          </>
        ) : pedido.tipo_entrega === 'retirada' ? (
          <p className="flex items-center gap-2 font-semibold">
            <Store className="h-4 w-4 text-gray-500" /> Retirada no local
          </p>
        ) : null}
        {pedido.observacoes && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
            {pedido.observacoes}
          </p>
        )}
      </div>

      {erro && <p className="mt-3 text-sm text-rose-600">{erro}</p>}

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        {confirmandoRecusa ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-rose-700">Recusar este pedido?</span>
            <button
              type="button"
              onClick={() => executar('recusar')}
              disabled={ocupado}
              className="btn-danger px-3 py-1.5"
            >
              {acao === 'recusar' && <Loader2 className="h-4 w-4 animate-spin" />}
              Sim, recusar
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoRecusa(false)}
              disabled={ocupado}
              className="btn-secondary px-3 py-1.5"
            >
              Voltar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmandoRecusa(true)}
            disabled={ocupado}
            className="btn-secondary px-3 py-1.5 text-rose-600"
          >
            Recusar
          </button>
        )}
        <button
          type="button"
          onClick={() => executar('aceitar')}
          disabled={ocupado}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {acao === 'aceitar' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          Aceitar pedido
        </button>
      </div>
    </div>
  )
}
