import { useEffect, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  type TooltipProps,
} from 'recharts'
import { ShoppingBag, Wallet, Receipt, CalendarRange, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  chaveDiaLocal,
  formatCurrency,
  formatPhone,
  formatRelativeTime,
  parseAsUtc,
  stripWhatsappSuffix,
} from '@/lib/format'
import { PedidoStatusBadge } from '@/components/ui/PedidoBadges'
import AtendimentosEmAndamentoCard from './AtendimentosEmAndamentoCard'
import type { Pedido, StatusPedido } from '@/types/database'

const STATUS_ABERTOS: StatusPedido[] = ['novo', 'confirmado', 'preparando']
const DIAS_GRAFICO = 30
const LIMITE_ABERTOS = 6
const LIMITE_MAIS_VENDIDOS = 5
// O PostgREST devolve no máximo 1000 linhas por request — busca paginada.
const TAMANHO_PAGINA = 1000
// Agrupa rajadas de eventos (pedido + itens + updates) numa recarga só.
const RECARGA_DEBOUNCE_MS = 3000

const TOOLTIP_STYLE = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  fontSize: 13,
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
}

interface Metricas {
  pedidosHoje: number
  pedidosOntem: number
  faturamentoHoje: number
  pedidosMes: number
  faturamentoMes: number
  faturamentoMesAnterior: number
}

interface PontoDia {
  dia: string
  pedidos: number
  faturamento: number
}

interface ItemVendido {
  nome: string
  quantidade: number
  valor: number
}

type PedidoAberto = Pick<Pedido, 'id' | 'nome_cliente' | 'telefone' | 'total' | 'status' | 'criado_em'>

const METRICAS_VAZIAS: Metricas = {
  pedidosHoje: 0,
  pedidosOntem: 0,
  faturamentoHoje: 0,
  pedidosMes: 0,
  faturamentoMes: 0,
  faturamentoMesAnterior: 0,
}

/** Variação percentual; null quando o período anterior foi 0 (não há base pra comparar). */
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

async function buscarTodos<T>(
  pagina: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>
): Promise<T[]> {
  const todos: T[] = []
  for (let from = 0; ; from += TAMANHO_PAGINA) {
    const { data, error } = await pagina(from, from + TAMANHO_PAGINA - 1)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as T[]
    todos.push(...rows)
    if (rows.length < TAMANHO_PAGINA) return todos
  }
}

export default function DashboardPedidos({ instanceId }: { instanceId: string }) {
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [metricas, setMetricas] = useState<Metricas>(METRICAS_VAZIAS)
  const [grafico, setGrafico] = useState<PontoDia[]>([])
  const [maisVendidos, setMaisVendidos] = useState<ItemVendido[]>([])
  const [abertos, setAbertos] = useState<PedidoAberto[]>([])
  const [totalAbertos, setTotalAbertos] = useState(0)

  useEffect(() => {
    let cancelled = false
    let debounce: ReturnType<typeof setTimeout> | undefined

    async function load() {
      // Todos os limites são meia-noite no fuso LOCAL do navegador. Como
      // criado_em é timestamp sem fuso gravado em UTC, o toISOString() (UTC)
      // desses limites compara corretamente com a coluna.
      const agora = new Date()
      const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
      const ontem = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1)
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
      const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
      const inicioGrafico = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - (DIAS_GRAFICO - 1))
      const inicioBusca = inicioMesAnterior < inicioGrafico ? inicioMesAnterior : inicioGrafico

      try {
        const [pedidos, itens, abertosRes] = await Promise.all([
          buscarTodos<{ total: number; criado_em: string }>((from, to) =>
            supabase
              .from('pedidos')
              .select('total, criado_em')
              .eq('instance_id', instanceId)
              .neq('status', 'cancelado')
              .gte('criado_em', inicioBusca.toISOString())
              .order('criado_em')
              .order('id')
              .range(from, to)
          ),
          buscarTodos<{ nome_item: string; quantidade: number; preco_unitario: number }>((from, to) =>
            supabase
              .from('itens_pedido')
              .select('nome_item, quantidade, preco_unitario, pedidos!inner(instance_id, status, criado_em)')
              .eq('pedidos.instance_id', instanceId)
              .neq('pedidos.status', 'cancelado')
              .gte('pedidos.criado_em', inicioGrafico.toISOString())
              .order('id')
              .range(from, to)
          ),
          supabase
            .from('pedidos')
            .select('id, nome_cliente, telefone, total, status, criado_em', { count: 'exact' })
            .eq('instance_id', instanceId)
            .in('status', STATUS_ABERTOS)
            .order('criado_em', { ascending: false })
            .limit(LIMITE_ABERTOS),
        ])
        if (cancelled) return

        const m: Metricas = { ...METRICAS_VAZIAS }
        const porDia = new Map<string, PontoDia>()
        for (let i = 0; i < DIAS_GRAFICO; i++) {
          const d = new Date(inicioGrafico.getFullYear(), inicioGrafico.getMonth(), inicioGrafico.getDate() + i)
          porDia.set(chaveDiaLocal(d), {
            dia: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d),
            pedidos: 0,
            faturamento: 0,
          })
        }

        for (const p of pedidos) {
          const criado = parseAsUtc(p.criado_em)
          const total = Number(p.total)
          if (criado >= hoje) {
            m.pedidosHoje++
            m.faturamentoHoje += total
          } else if (criado >= ontem) {
            m.pedidosOntem++
          }
          if (criado >= inicioMes) {
            m.pedidosMes++
            m.faturamentoMes += total
          } else if (criado >= inicioMesAnterior) {
            m.faturamentoMesAnterior += total
          }
          const ponto = porDia.get(chaveDiaLocal(criado))
          if (ponto) {
            ponto.pedidos++
            ponto.faturamento += total
          }
        }

        const vendidos = new Map<string, ItemVendido>()
        for (const item of itens) {
          const atual = vendidos.get(item.nome_item) ?? { nome: item.nome_item, quantidade: 0, valor: 0 }
          atual.quantidade += item.quantidade
          atual.valor += item.quantidade * Number(item.preco_unitario)
          vendidos.set(item.nome_item, atual)
        }

        setMetricas(m)
        setGrafico(Array.from(porDia.values()))
        setMaisVendidos(
          Array.from(vendidos.values())
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, LIMITE_MAIS_VENDIDOS)
        )
        setAbertos((abertosRes.data ?? []) as PedidoAberto[])
        setTotalAbertos(abertosRes.count ?? 0)
        setErro(null)
      } catch {
        if (!cancelled) setErro('Não foi possível carregar os dados do dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    const channel = supabase
      .channel(`dashboard-pedidos-${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `instance_id=eq.${instanceId}` },
        () => {
          clearTimeout(debounce)
          debounce = setTimeout(load, RECARGA_DEBOUNCE_MS)
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      clearTimeout(debounce)
      supabase.removeChannel(channel)
    }
  }, [instanceId])

  const ticketMedio = metricas.pedidosMes > 0 ? metricas.faturamentoMes / metricas.pedidosMes : 0
  const maiorQuantidade = maisVendidos[0]?.quantidade ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-brand-gray">Visão geral dos pedidos</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : (
        <>
          {erro && <p className="text-sm text-rose-600">{erro}</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CardMetrica
              label="Pedidos hoje"
              value={metricas.pedidosHoje}
              icon={ShoppingBag}
              change={pctChange(metricas.pedidosHoje, metricas.pedidosOntem)}
              changeLabel="vs ontem"
            />
            <CardMetrica
              label="Faturamento hoje"
              value={formatCurrency(metricas.faturamentoHoje)}
              icon={Wallet}
              legenda={`${metricas.pedidosHoje} ${metricas.pedidosHoje === 1 ? 'pedido' : 'pedidos'}`}
            />
            <CardMetrica
              label="Ticket médio (mês)"
              value={formatCurrency(ticketMedio)}
              icon={Receipt}
              legenda={`${metricas.pedidosMes} ${metricas.pedidosMes === 1 ? 'pedido' : 'pedidos'} no mês`}
            />
            <CardMetrica
              label="Faturamento (mês)"
              value={formatCurrency(metricas.faturamentoMes)}
              icon={CalendarRange}
              change={pctChange(metricas.faturamentoMes, metricas.faturamentoMesAnterior)}
              changeLabel="vs mês anterior"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">
                Pedidos por dia (últimos {DIAS_GRAFICO} dias)
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={grafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="dia" stroke="#9ca3af" fontSize={12} interval={4} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} content={<TooltipDia />} />
                  <Bar dataKey="pedidos" name="Pedidos" fill="#0EA57A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">
                Mais vendidos ({DIAS_GRAFICO} dias)
              </h2>
              {maisVendidos.length === 0 ? (
                <p className="text-sm text-brand-gray">Nenhum item vendido no período.</p>
              ) : (
                <ul className="space-y-4">
                  {maisVendidos.map((item, i) => (
                    <li key={item.nome} className="text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary">
                            {i + 1}
                          </span>
                          <span className="truncate font-medium text-gray-900">{item.nome}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="font-semibold text-gray-900">{item.quantidade} un.</span>
                          <span className="ml-2 text-xs text-brand-gray">{formatCurrency(item.valor)}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-brand-secondary"
                          style={{ width: `${maiorQuantidade ? (item.quantidade / maiorQuantidade) * 100 : 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AtendimentosEmAndamentoCard instanceId={instanceId} />

            <div className="card">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">
                Pedidos em aberto{totalAbertos > 0 && ` (${totalAbertos})`}
              </h2>
              {abertos.length === 0 ? (
                <p className="text-sm text-brand-gray">Nenhum pedido em aberto.</p>
              ) : (
                <ul className="space-y-3">
                  {abertos.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {p.nome_cliente || formatPhone(stripWhatsappSuffix(p.telefone))}
                        </p>
                        <p className="truncate text-xs text-brand-gray">
                          {formatCurrency(Number(p.total))} · {formatRelativeTime(p.criado_em)}
                        </p>
                      </div>
                      <PedidoStatusBadge status={p.status} />
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/app/pedidos"
                className="mt-4 inline-block text-xs font-medium text-brand-primary hover:underline"
              >
                Ver todos →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface CardMetricaProps {
  label: string
  value: string | number
  icon: ComponentType<{ className?: string }>
  /** undefined = card sem comparação (mostra a legenda); null = sem base pra comparar. */
  change?: number | null
  changeLabel?: string
  legenda?: string
}

function CardMetrica({ label, value, icon: Icon, change, changeLabel, legenda }: CardMetricaProps) {
  const isPositive = (change ?? 0) > 0
  const isNeutral = change === null || change === 0
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-gray">{label}</p>
        <div className="rounded-lg bg-brand-secondary/10 p-2 text-brand-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      {change === undefined ? (
        <p className="mt-1 text-xs font-medium text-brand-gray">{legenda}</p>
      ) : (
        <p
          className={`mt-1 text-xs font-medium ${
            isNeutral ? 'text-brand-gray' : isPositive ? 'text-brand-primary' : 'text-rose-500'
          }`}
        >
          {isNeutral || change === null ? '—' : `${isPositive ? '+' : ''}${change.toFixed(0)}%`} {changeLabel}
        </p>
      )}
    </div>
  )
}

function TooltipDia({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const ponto = payload[0].payload as PontoDia
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2">
      <p className="mb-1 text-gray-500">{ponto.dia}</p>
      <p className="font-medium text-gray-900">
        {ponto.pedidos} {ponto.pedidos === 1 ? 'pedido' : 'pedidos'}
      </p>
      <p className="text-gray-700">{formatCurrency(ponto.faturamento)}</p>
    </div>
  )
}
