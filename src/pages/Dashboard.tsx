import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { UserPlus, CalendarCheck2, TrendingUp, Wallet, Loader2, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'
import {
  chaveDiaLocal,
  formatCurrency,
  formatDataHoraClinica,
  formatDateTime,
  parseDataHoraClinica,
  toDataHoraClinica,
} from '@/lib/format'
import { AgendamentoStatusBadge } from '@/components/ui/StatusBadge'
import DashboardPedidos from '@/components/dashboard/DashboardPedidos'
import type { LeadPaciente } from '@/types/database'

interface DashboardStats {
  leadsHoje: number
  leadsOntem: number
  agendamentosHoje: number
  agendamentosOntem: number
  taxaConversao: number
  taxaConversaoAnterior: number
  faturamentoPrevisto: number
  faturamentoAnterior: number
}

interface ChartPoint {
  dia: string
  total: number
}

interface AgendamentoUpcoming {
  id: string
  data_hora: string
  contato: string
  servico: string
}

interface AtendimentoEmAndamento {
  lead: LeadPaciente
  ultimaMensagem: string | null
  horario: string | null
}

const DIAS_GRAFICO = 30

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Variação percentual; null quando o período anterior foi 0 (não há base pra comparar). */
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

/** Escolhe o dashboard pela vertical do cliente (mesmo padrão do Sidebar). */
export default function Dashboard() {
  const { instances, instanceId } = useInstance()
  const tipoNegocio = instances.find((i) => i.instance_id === instanceId)?.tipo_negocio
  if (instanceId && tipoNegocio === 'pedidos') {
    return <DashboardPedidos key={instanceId} instanceId={instanceId} />
  }
  return <DashboardAgendamento />
}

function DashboardAgendamento() {
  const { instanceId } = useInstance()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    leadsHoje: 0,
    leadsOntem: 0,
    agendamentosHoje: 0,
    agendamentosOntem: 0,
    taxaConversao: 0,
    taxaConversaoAnterior: 0,
    faturamentoPrevisto: 0,
    faturamentoAnterior: 0,
  })
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [proximos, setProximos] = useState<AgendamentoUpcoming[]>([])
  const [emAndamento, setEmAndamento] = useState<AtendimentoEmAndamento[]>([])

  useEffect(() => {
    if (!instanceId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const now = new Date()
      const todayStart = startOfDay(now)
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)
      const monthStart = startOfMonth(now)
      const prevMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1)
      // Meia-noite local de 29 dias atrás: o gráfico cobre hoje + os 29 dias anteriores.
      const inicioGrafico = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (DIAS_GRAFICO - 1))

      const [
        leadsHojeRes,
        leadsOntemRes,
        agendamentosHojeRes,
        agendamentosOntemRes,
        leadsMesRes,
        leadsMesAnteriorRes,
        agendamentosMesRes,
        agendamentosMesAnteriorRes,
        agendamentos30dRes,
        proximosRes,
        emAndamentoRes,
      ] = await Promise.all([
        supabase
          .from('leads_pacientes')
          .select('id', { count: 'exact', head: true })
          .eq('instance_id', instanceId)
          .gte('criado_em', todayStart.toISOString())
          .lt('criado_em', todayEnd.toISOString()),
        supabase
          .from('leads_pacientes')
          .select('id', { count: 'exact', head: true })
          .eq('instance_id', instanceId)
          .gte('criado_em', yesterdayStart.toISOString())
          .lt('criado_em', todayStart.toISOString()),
        supabase
          .from('agendamentos')
          .select('id', { count: 'exact', head: true })
          .eq('instance_id', instanceId)
          .neq('status', 'cancelado')
          .gte('data_hora', toDataHoraClinica(todayStart))
          .lt('data_hora', toDataHoraClinica(todayEnd)),
        supabase
          .from('agendamentos')
          .select('id', { count: 'exact', head: true })
          .eq('instance_id', instanceId)
          .neq('status', 'cancelado')
          .gte('data_hora', toDataHoraClinica(yesterdayStart))
          .lt('data_hora', toDataHoraClinica(todayStart)),
        supabase
          .from('leads_pacientes')
          .select('id, status')
          .eq('instance_id', instanceId)
          .gte('criado_em', monthStart.toISOString()),
        supabase
          .from('leads_pacientes')
          .select('id, status')
          .eq('instance_id', instanceId)
          .gte('criado_em', prevMonthStart.toISOString())
          .lt('criado_em', monthStart.toISOString()),
        supabase
          .from('agendamentos')
          .select('id, data_hora, status, servicos(valor)')
          .eq('instance_id', instanceId)
          .in('status', ['confirmado', 'compareceu'])
          .gte('data_hora', toDataHoraClinica(monthStart)),
        supabase
          .from('agendamentos')
          .select('id, data_hora, status, servicos(valor)')
          .eq('instance_id', instanceId)
          .in('status', ['confirmado', 'compareceu'])
          .gte('data_hora', toDataHoraClinica(prevMonthStart))
          .lt('data_hora', toDataHoraClinica(monthStart)),
        supabase
          .from('agendamentos')
          .select('id, data_hora')
          .eq('instance_id', instanceId)
          .neq('status', 'cancelado')
          .gte('data_hora', toDataHoraClinica(inicioGrafico)),
        supabase
          .from('agendamentos')
          .select('id, data_hora, leads_pacientes(nome), servicos(nome)')
          .eq('instance_id', instanceId)
          .eq('status', 'confirmado')
          .gte('data_hora', toDataHoraClinica(now))
          .order('data_hora', { ascending: true })
          .limit(5),
        supabase
          .from('leads_pacientes')
          .select('*')
          .eq('instance_id', instanceId)
          .eq('status', 'em_atendimento')
          .order('atualizado_em', { ascending: false })
          .limit(5),
      ])

      if (cancelled) return

      const calcConversao = (rows: Array<{ status: string }>) => {
        if (rows.length === 0) return 0
        const convertidos = rows.filter((l) => ['agendado', 'compareceu'].includes(l.status)).length
        return (convertidos / rows.length) * 100
      }

      const calcFaturamento = (rows: Array<{ servicos: { valor: number } | null }>) =>
        rows.reduce((sum, row) => sum + Number(row.servicos?.valor ?? 0), 0)

      const leadsMes = leadsMesRes.data ?? []
      const leadsMesAnterior = leadsMesAnteriorRes.data ?? []
      const agendamentosMes = (agendamentosMesRes.data ?? []) as unknown as Array<{
        servicos: { valor: number } | null
      }>
      const agendamentosMesAnterior = (agendamentosMesAnteriorRes.data ?? []) as unknown as Array<{
        servicos: { valor: number } | null
      }>

      // Agrupa pelo dia LOCAL. data_hora é hora da clínica (sem fuso).
      const byDay = new Map<string, ChartPoint>()
      for (let i = 0; i < DIAS_GRAFICO; i++) {
        const d = new Date(inicioGrafico.getFullYear(), inicioGrafico.getMonth(), inicioGrafico.getDate() + i)
        byDay.set(chaveDiaLocal(d), {
          dia: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d),
          total: 0,
        })
      }
      for (const row of agendamentos30dRes.data ?? []) {
        const ponto = byDay.get(chaveDiaLocal(parseDataHoraClinica((row as { data_hora: string }).data_hora)))
        if (ponto) ponto.total++
      }
      const chart: ChartPoint[] = Array.from(byDay.values())

      const proximosList: AgendamentoUpcoming[] = (proximosRes.data ?? []).map((row: any) => ({
        id: row.id,
        data_hora: row.data_hora,
        contato: row.leads_pacientes?.nome ?? 'Sem nome',
        servico: row.servicos?.nome ?? '—',
      }))

      const emAndamentoLeads = (emAndamentoRes.data ?? []) as LeadPaciente[]
      let emAndamentoList: AtendimentoEmAndamento[] = emAndamentoLeads.map((lead) => ({
        lead,
        ultimaMensagem: null,
        horario: null,
      }))

      if (emAndamentoLeads.length > 0) {
        const telefones = emAndamentoLeads.map((l) => l.telefone)
        const { data: conversasData } = await supabase
          .from('conversas')
          .select('*')
          .eq('instance_id', instanceId)
          .in('telefone', telefones)
          .order('criado_em', { ascending: false })

        if (!cancelled) {
          const latestByTelefone = new Map<string, { mensagem: string; criado_em: string }>()
          for (const c of conversasData ?? []) {
            if (!latestByTelefone.has(c.telefone)) {
              latestByTelefone.set(c.telefone, { mensagem: c.mensagem, criado_em: c.criado_em })
            }
          }
          emAndamentoList = emAndamentoLeads.map((lead) => {
            const ultima = latestByTelefone.get(lead.telefone)
            return {
              lead,
              ultimaMensagem: ultima?.mensagem ?? null,
              horario: ultima?.criado_em ?? null,
            }
          })
        }
      }

      if (cancelled) return

      setStats({
        leadsHoje: leadsHojeRes.count ?? 0,
        leadsOntem: leadsOntemRes.count ?? 0,
        agendamentosHoje: agendamentosHojeRes.count ?? 0,
        agendamentosOntem: agendamentosOntemRes.count ?? 0,
        taxaConversao: calcConversao(leadsMes),
        taxaConversaoAnterior: calcConversao(leadsMesAnterior),
        faturamentoPrevisto: calcFaturamento(agendamentosMes),
        faturamentoAnterior: calcFaturamento(agendamentosMesAnterior),
      })
      setChartData(chart)
      setProximos(proximosList)
      setEmAndamento(emAndamentoList)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [instanceId])

  const cards = useMemo(
    () => [
      {
        label: 'Leads novos hoje',
        value: stats.leadsHoje,
        change: pctChange(stats.leadsHoje, stats.leadsOntem),
        changeLabel: 'vs ontem',
        icon: UserPlus,
      },
      {
        label: 'Agendamentos hoje',
        value: stats.agendamentosHoje,
        change: pctChange(stats.agendamentosHoje, stats.agendamentosOntem),
        changeLabel: 'vs ontem',
        icon: CalendarCheck2,
      },
      {
        label: 'Taxa de conversão (mês)',
        value: `${stats.taxaConversao.toFixed(1)}%`,
        change: pctChange(stats.taxaConversao, stats.taxaConversaoAnterior),
        changeLabel: 'vs mês anterior',
        icon: TrendingUp,
      },
      {
        label: 'Faturamento previsto (mês)',
        value: formatCurrency(stats.faturamentoPrevisto),
        change: pctChange(stats.faturamentoPrevisto, stats.faturamentoAnterior),
        changeLabel: 'vs mês anterior',
        icon: Wallet,
      },
    ],
    [stats]
  )

  if (!instanceId) {
    return <p className="text-sm text-brand-gray">Selecione um negócio para visualizar o dashboard.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-brand-gray">Visão geral do negócio</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => {
              const isPositive = (c.change ?? 0) > 0
              const isNeutral = c.change === null || c.change === 0
              return (
                <div key={c.label} className="card">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-brand-gray">{c.label}</p>
                    <div className="rounded-lg bg-brand-secondary/10 p-2 text-brand-primary">
                      <c.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-gray-900">{c.value}</p>
                  <p
                    className={`mt-1 text-xs font-medium ${
                      isNeutral ? 'text-brand-gray' : isPositive ? 'text-brand-primary' : 'text-rose-500'
                    }`}
                  >
                    {isNeutral || c.change === null ? '—' : `${isPositive ? '+' : ''}${c.change.toFixed(0)}%`}{' '}
                    {c.changeLabel}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">
                Agendamentos por dia (últimos {DIAS_GRAFICO} dias)
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="agendamentosGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0EA57A" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0EA57A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="dia" stroke="#9ca3af" fontSize={12} interval={4} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 12,
                      fontSize: 13,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                    labelStyle={{ color: '#6b7280' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Agendamentos"
                    stroke="#0EA57A"
                    strokeWidth={2}
                    fill="url(#agendamentosGradient)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Atendimentos em andamento</h2>
              {emAndamento.length === 0 ? (
                <p className="text-sm text-brand-gray">Nenhum atendimento em andamento.</p>
              ) : (
                <ul className="space-y-3">
                  {emAndamento.map(({ lead, ultimaMensagem, horario }) => (
                    <li key={lead.id} className="flex items-center gap-3 text-sm">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-semibold text-brand-primary">
                        {(lead.nome ?? lead.telefone).slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{lead.nome ?? lead.telefone}</p>
                        <p className="truncate text-xs text-brand-gray">
                          {ultimaMensagem ?? 'Sem mensagens recentes'}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {horario && (
                          <span className="text-xs text-brand-gray">{formatDateTime(horario)}</span>
                        )}
                        <span className="badge bg-brand-primary/10 text-brand-dark">
                          <MessageCircle className="mr-1 h-3 w-3" />
                          Em atendimento
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/app/atendimentos"
                className="mt-4 inline-block text-xs font-medium text-brand-primary hover:underline"
              >
                Ver todos →
              </Link>
            </div>

            <div className="card">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Próximos agendamentos</h2>
              {proximos.length === 0 ? (
                <p className="text-sm text-brand-gray">Nenhum agendamento futuro.</p>
              ) : (
                <ul className="space-y-3">
                  {proximos.map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{a.contato}</p>
                        <p className="truncate text-xs text-brand-gray">{a.servico}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-brand-gray">{formatDataHoraClinica(a.data_hora)}</span>
                        <AgendamentoStatusBadge status="confirmado" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/app/agendamentos"
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
