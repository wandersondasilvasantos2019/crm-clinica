import { useEffect, useMemo, useState } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Search, Loader2, XCircle } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'
import PedidoKanbanColumn from '@/components/kanban/PedidoKanbanColumn'
import PedidoDetailModal from '@/components/kanban/PedidoDetailModal'
import { STATUS_PEDIDO_FLUXO, STATUS_PEDIDO_LABELS } from '@/types/database'
import type { ItemPedido, Pedido, PedidoComItens, StatusPedido } from '@/types/database'

const COLUMN_COLORS: Record<StatusPedido, string> = {
  novo: 'bg-sky-400',
  confirmado: 'bg-violet-400',
  preparando: 'bg-amber-400',
  entregue: 'bg-brand-primary',
  cancelado: 'bg-rose-400',
}

const PEDIDO_SELECT = '*, itens_pedido(*)'
const STATUS_ABERTOS: StatusPedido[] = ['novo', 'confirmado', 'preparando']
const STATUS_FINALIZADOS: StatusPedido[] = ['entregue', 'cancelado']
// Entregues/cancelados só aparecem por alguns dias — sem isso a página carrega a
// história inteira de pedidos e a coluna "Entregue" cresce pra sempre.
const DIAS_FINALIZADOS = 7

// A IA costuma inserir o pedido e só depois os itens — espera um pouco antes de
// buscar os itens de um pedido recém-criado recebido via realtime.
const INSERT_REFETCH_DELAY_MS = 1500

function normalize(row: Pedido & { itens_pedido?: ItemPedido[] | null }): PedidoComItens {
  const itens = [...(row.itens_pedido ?? [])].sort((a, b) => a.criado_em.localeCompare(b.criado_em))
  return { ...row, itens_pedido: itens }
}

export default function Pedidos() {
  const { instanceId } = useInstance()
  const [pedidos, setPedidos] = useState<PedidoComItens[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCancelados, setShowCancelados] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!instanceId) return
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    async function load() {
      setLoading(true)
      const agora = new Date()
      // Meia-noite local de N dias atrás; criado_em é UTC, então compara em ISO.
      const inicioFinalizados = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - DIAS_FINALIZADOS)

      const [abertosRes, finalizadosRes] = await Promise.all([
        supabase
          .from('pedidos')
          .select(PEDIDO_SELECT)
          .eq('instance_id', instanceId)
          .in('status', STATUS_ABERTOS)
          .order('criado_em', { ascending: false }),
        supabase
          .from('pedidos')
          .select(PEDIDO_SELECT)
          .eq('instance_id', instanceId)
          .in('status', STATUS_FINALIZADOS)
          .gte('criado_em', inicioFinalizados.toISOString())
          .order('criado_em', { ascending: false }),
      ])

      if (!cancelled) {
        const todos = [...(abertosRes.data ?? []), ...(finalizadosRes.data ?? [])]
          .map(normalize)
          .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
        setPedidos(todos)
        setLoading(false)
      }
    }

    async function refetchOne(id: string) {
      const { data } = await supabase.from('pedidos').select(PEDIDO_SELECT).eq('id', id).maybeSingle()
      if (cancelled || !data) return
      const fresh = normalize(data)
      setPedidos((current) =>
        current.some((p) => p.id === id)
          ? current.map((p) => (p.id === id ? fresh : p))
          : [fresh, ...current]
      )
    }

    function upsertLocal(incoming: Pedido) {
      setPedidos((current) => {
        const existing = current.find((p) => p.id === incoming.id)
        if (existing) {
          return current.map((p) =>
            p.id === incoming.id ? { ...incoming, itens_pedido: existing.itens_pedido } : p
          )
        }
        return [{ ...incoming, itens_pedido: [] }, ...current]
      })
    }

    load()

    // Só INSERT/UPDATE: o Supabase não entrega DELETE em canais com filtro.
    const filter = `instance_id=eq.${instanceId}`
    const channel = supabase
      .channel(`pedidos-${instanceId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos', filter }, (payload) => {
        const incoming = payload.new as Pedido
        upsertLocal(incoming)
        timers.push(setTimeout(() => refetchOne(incoming.id), INSERT_REFETCH_DELAY_MS))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter }, (payload) => {
        upsertLocal(payload.new as Pedido)
      })
      .subscribe()

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      supabase.removeChannel(channel)
    }
  }, [instanceId])

  const filteredPedidos = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return pedidos
    return pedidos.filter(
      (p) =>
        (p.nome_cliente ?? '').toLowerCase().includes(term) ||
        p.telefone.toLowerCase().includes(term) ||
        p.itens_pedido.some((i) => i.nome_item.toLowerCase().includes(term))
    )
  }, [pedidos, search])

  const pedidosByStatus = useMemo(() => {
    const map: Record<StatusPedido, PedidoComItens[]> = {
      novo: [],
      confirmado: [],
      preparando: [],
      entregue: [],
      cancelado: [],
    }
    for (const pedido of filteredPedidos) {
      map[pedido.status]?.push(pedido)
    }
    return map
  }, [filteredPedidos])

  const selectedPedido = useMemo(
    () => pedidos.find((p) => p.id === selectedId) ?? null,
    [pedidos, selectedId]
  )

  async function updateStatus(id: string, newStatus: StatusPedido): Promise<boolean> {
    const previous = pedidos
    const now = new Date().toISOString()

    setPedidos((current) =>
      current.map((p) => (p.id === id ? { ...p, status: newStatus, atualizado_em: now } : p))
    )

    const { error } = await supabase
      .from('pedidos')
      .update({ status: newStatus, atualizado_em: now })
      .eq('id', id)

    if (error) {
      setPedidos(previous)
      return false
    }
    return true
  }

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return
    await updateStatus(draggableId, destination.droppableId as StatusPedido)
  }

  if (!instanceId) {
    return <p className="text-sm text-gray-400">Selecione um negócio para visualizar os pedidos.</p>
  }

  const colunas: StatusPedido[] = showCancelados
    ? [...STATUS_PEDIDO_FLUXO, 'cancelado']
    : STATUS_PEDIDO_FLUXO

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-brand-gray">
            Acompanhe os pedidos por etapa · entregues e cancelados dos últimos {DIAS_FINALIZADOS} dias
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setShowCancelados((v) => !v)}
            className={clsx(
              'inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition',
              showCancelados
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            <XCircle className="h-4 w-4" />
            Cancelados ({pedidosByStatus.cancelado.length})
          </button>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone ou item"
              className="input pl-9"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
            {colunas.map((status) => (
              <PedidoKanbanColumn
                key={status}
                status={status}
                title={STATUS_PEDIDO_LABELS[status]}
                colorClass={COLUMN_COLORS[status]}
                pedidos={pedidosByStatus[status]}
                onCardClick={(p) => setSelectedId(p.id)}
              />
            ))}
          </div>
        </DragDropContext>
      )}

      <PedidoDetailModal
        pedido={selectedPedido}
        onClose={() => setSelectedId(null)}
        onStatusChange={(p, status) => updateStatus(p.id, status)}
      />
    </div>
  )
}
