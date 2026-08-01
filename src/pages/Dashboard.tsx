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
import { UserPlus, CalendarCheck2, TrendingUp, Wallet, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { LeadStatusBadge } from '@/components/ui/StatusBadge'
import type { LeadPaciente } from '@/types/database'

interface DashboardStats {
  leadsHoje: number
  agendamentosHoje: number
  taxaConversao: number
  faturamentoPrevisto: number
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

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export default function Dashboard() {
  const { instanceId } = useInstance()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    leadsHoje: 0,
    agendamentosHoje: 0,
    taxaConversao: 0,
    faturamentoPrevisto: 0,
  })
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [proximos, setProximos] = useState<AgendamentoUpcoming[]>([])
  const [novosLeads, setNovosLeads] = useState<LeadPaciente[]>([])

  useEffect(() => {
    if (!instanceId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const now = new Date()
      const todayStart = startOfDay(now)
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
      const monthStart = startOfMonth(now)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const [leadsHojeRes, agendamentosHojeRes, leadsMesRes, agendamentosMesRes, agendamentos30dRes, proximosRes, novosLeadsRes] =
        await Promise.all([
          supabase
            .from('leads_pacientes')
            .select('id', { count: 'exact', head: true })
            .eq('instance_id', instanceId)
            .gte('criado_em', todayStart.toISOString())
            .lt('criado_em', todayEnd.toISOString()),
          supabase
            .from('agendamentos')
            .select('id', { count: 'exact', head: true })
            .eq('instance_id', instanceId)
            .neq('status', 'cancelado')
            .gte('data_hora', todayStart.toISOString())
            .lt('data_hora', todayEnd.toISOString()),
          supabase
            .from('leads_pacientes')
            .select('id, status')
            .eq('instance_id', instanceId)
            .gte('criado_em', monthStart.toISOString()),
          supabase
            .from('agendamentos')
            .select('id, data_hora, status, servicos(valor)')
            .eq('instance_id', instanceId)
            .in('status', ['confirmado', 'realizado'])
            .gte('data_hora', monthStart.toISOString()),
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
            .eq('status', 'novo_lead')
            .order('criado_em', { ascending: false })
            .limit(5),
        ])

      if (cancelled) return

      const leadsMes = leadsMesRes.data ?? []
      const convertidos = leadsMes.filter((l) =>
        ['agendado', 'compareceu'].includes(l.status)
      ).length
      const taxaConversao = leadsMes.length > 0 ? (convertidos / leadsMes.length) * 100 : 0

      const faturamentoPrevisto = (agendamentosMesRes.data ?? []).reduce((sum, row: any) => {
        const valor = row.servicos?.valor ?? 0
        return sum + Number(valor)
      }, 0)

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

      setStats({
        leadsHoje: leadsHojeRes.count ?? 0,
        agendamentosHoje: agendamentosHojeRes.count ?? 0,
        taxaConversao,
        faturamentoPrevisto,
      })
      setChartData(chart)
      setProximos(proximosList)
      setNovosLeads(novosLeadsRes.data ?? [])
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
        icon: UserPlus,
        color: 'text-sky-600 bg-sky-100',
      },
      {
        label: 'Agendamentos hoje',
        value: stats.agendamentosHoje,
        icon: CalendarCheck2,
        color: 'text-violet-600 bg-violet-100',
      },
      {
        label: 'Taxa de conversão (mês)',
        value: `${stats.taxaConversao.toFixed(1)}%`,
        icon: TrendingUp,
        color: 'text-emerald-600 bg-emerald-100',
      },
      {
        label: 'Faturamento previsto (mês)',
        value: formatCurrency(stats.faturamentoPrevisto),
        icon: Wallet,
        color: 'text-amber-600 bg-amber-100',
      },
    ],
    [stats]
  )

  if (!instanceId) {
    return <p className="text-sm text-gray-400">Selecione uma clínica para visualizar o dashboard.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">Visão geral da clínica</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="card">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{c.label}</p>
                  <div className={`rounded-lg p-2 ${c.color}`}>
                    <c.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-semibold text-gray-900">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              Agendamentos por dia (últimos 30 dias)
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="agendamentosGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
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
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#agendamentosGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Próximos agendamentos</h2>
              {proximos.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhum agendamento futuro.</p>
              ) : (
                <ul className="space-y-3">
                  {proximos.map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{a.paciente}</p>
                        <p className="text-xs text-gray-400">{a.servico}</p>
                      </div>
                      <span className="text-xs text-gray-500">{formatDateTime(a.data_hora)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/agendamentos"
                className="mt-4 inline-block text-xs font-medium text-emerald-600 hover:underline"
              >
                Ver todos →
              </Link>
            </div>

            <div className="card">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Leads mais recentes</h2>
              {novosLeads.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhum lead novo.</p>
              ) : (
                <ul className="space-y-3">
                  {novosLeads.map((l) => (
                    <li key={l.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{l.nome ?? l.telefone}</p>
                        <p className="text-xs text-gray-400">{l.telefone}</p>
                      </div>
                      <LeadStatusBadge status={l.status} />
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/contatos"
                className="mt-4 inline-block text-xs font-medium text-emerald-600 hover:underline"
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
