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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { UserPlus, CalendarCheck2, TrendingUp, Wallet, Loader2, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { AgendamentoStatusBadge } from '@/components/ui/StatusBadge'
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
  paciente: string
  servico: string
}

interface AtendimentoEmAndamento {
  lead: LeadPaciente
  ultimaMensagem: string | null
  horario: string | null
}

const LEAD_ORIGENS = [
  { name: 'WhatsApp', value: 62, color: '#0EA57A' },
  { name: 'Instagram', value: 18, color: '#F2A65A' },
  { name: 'Site', value: 12, color: '#13C296' },
  { name: 'Indicação', value: 8, color: '#8FD9C4' },
]

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export default function Dashboard() {
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
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

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
          .gte('data_hora', todayStart.toISOString())
          .lt('data_hora', todayEnd.toISOString()),
        supabase
          .from('agendamentos')
          .select('id', { count: 'exact', head: true })
          .eq('instance_id', instanceId)
          .neq('status', 'cancelado')
          .gte('data_hora', yesterdayStart.toISOString())
          .lt('data_hora', todayStart.toISOString()),
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
          .in('status', ['confirmado', 'realizado'])
          .gte('data_hora', monthStart.toISOString()),
        supabase
          .from('agendamentos')
          .select('id, data_hora, status, servicos(valor)')
          .eq('instance_id', instanceId)
          .in('status', ['confirmado', 'realizado'])
          .gte('data_hora', prevMonthStart.toISOString())
          .lt('data_hora', monthStart.toISOString()),
        supabase
          .from('agendamentos')
          .select('id, data_hora')
          .eq('instance_id', instanceId)
          .neq('status', 'cancelado')
          .gte('data_hora', thirtyDaysAgo.toISOString()),
        supabase
          .from('agendamentos')
          .select('id, data_hora, leads_pacientes(nome), servicos(nome)')
          .eq('instance_id', instanceId)
          .eq('status', 'confirmado')
          .gte('data_hora', now.toISOString())
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

      const byDay = new Map<string, number>()
      for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
        byDay.set(d.toISOString().slice(0, 10), 0)
      }
      for (const row of agendamentos30dRes.data ?? []) {
        const key = (row as { data_hora: string }).data_hora.slice(0, 10)
        if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1)
      }
      const chart: ChartPoint[] = Array.from(byDay.entries()).map(([key, total]) => ({
        dia: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(
          new Date(key)
        ),
        total,
      }))

      const proximosList: AgendamentoUpcoming[] = (proximosRes.data ?? []).map((row: any) => ({
        id: row.id,
        data_hora: row.data_hora,
        paciente: row.leads_pacientes?.nome ?? 'Sem nome',
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
    return <p className="text-sm text-brand-gray">Selecione uma clínica para visualizar o dashboard.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-brand-gray">Visão geral da clínica</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => {
              const isPositive = c.change > 0
              const isNeutral = c.change === 0
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
                    {isNeutral ? '—' : `${isPositive ? '+' : ''}${c.change.toFixed(0)}%`} {c.changeLabel}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">
                Agendamentos por dia (últimos 30 dias)
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

            <div className="card">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Origens dos leads</h2>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie
                      data={LEAD_ORIGENS}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {LEAD_ORIGENS.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${value}%`}
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        fontSize: 13,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="flex-1 space-y-2.5">
                  {LEAD_ORIGENS.map((origem) => (
                    <li key={origem.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-700">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: origem.color }}
                        />
                        {origem.name}
                      </span>
                      <span className="font-medium text-gray-900">{origem.value}%</span>
                    </li>
                  ))}
                </ul>
              </div>
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
                        <p className="truncate font-medium text-gray-900">{a.paciente}</p>
                        <p className="truncate text-xs text-brand-gray">{a.servico}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-brand-gray">{formatDateTime(a.data_hora)}</span>
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
