import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from 'recharts'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useInstance } from '@/context/InstanceContext'
import { formatCurrency } from '@/lib/format'
import { LEAD_STATUS_LABELS } from '@/types/database'
import type { LeadStatus } from '@/types/database'

type PeriodoDias = 7 | 30 | 90

const FUNIL_STATUSES: LeadStatus[] = ['novo_lead', 'em_atendimento', 'agendado', 'compareceu']
const FUNIL_COLORS = ['#002B2A', '#0EA57A', '#13C296', '#8FD9C4']

interface FaturamentoMes {
  mes: string
  valor: number
}

interface ServicoAgendado {
  nome: string
  total: number
}

interface FunilItem {
  name: string
  value: number
  fill: string
}

export default function Estatisticas() {
  const { instanceId } = useInstance()
  const [periodo, setPeriodo] = useState<PeriodoDias>(30)
  const [loading, setLoading] = useState(true)
  const [faturamento, setFaturamento] = useState<FaturamentoMes[]>([])
  const [servicos, setServicos] = useState<ServicoAgendado[]>([])
  const [funil, setFunil] = useState<FunilItem[]>([])

  useEffect(() => {
    if (!instanceId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const periodStart = new Date(Date.now() - periodo * 24 * 60 * 60 * 1000)

      const [agendamentosRes, leadsRes] = await Promise.all([
        supabase
          .from('agendamentos')
          .select('data_hora, status, servico:servicos(nome, valor)')
          .eq('instance_id', instanceId)
          .gte('data_hora', periodStart.toISOString()),
        supabase
          .from('leads_pacientes')
          .select('status')
          .eq('instance_id', instanceId)
          .gte('criado_em', periodStart.toISOString()),
      ])

      if (cancelled) return

      const agendamentosData = (agendamentosRes.data ?? []) as unknown as Array<{
        data_hora: string
        status: string
        servico: { nome: string; valor: number } | null
      }>

      const faturamentoMap = new Map<string, number>()
      const servicosMap = new Map<string, number>()

      for (const a of agendamentosData) {
        if (a.servico) {
          servicosMap.set(a.servico.nome, (servicosMap.get(a.servico.nome) ?? 0) + 1)
        }
        if (a.status === 'realizado' && a.servico) {
          const mesKey = a.data_hora.slice(0, 7)
          faturamentoMap.set(mesKey, (faturamentoMap.get(mesKey) ?? 0) + Number(a.servico.valor))
        }
      }

      const faturamentoOrdenado: FaturamentoMes[] = Array.from(faturamentoMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mesKey, valor]) => ({
          mes: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(
            new Date(`${mesKey}-01T00:00:00`)
          ),
          valor,
        }))

      const servicosOrdenados: ServicoAgendado[] = Array.from(servicosMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([nome, total]) => ({ nome, total }))

      const leadsData = (leadsRes.data ?? []) as Array<{ status: LeadStatus }>
      const funilData: FunilItem[] = FUNIL_STATUSES.map((status, i) => ({
        name: LEAD_STATUS_LABELS[status],
        value: leadsData.filter((l) => l.status === status).length,
        fill: FUNIL_COLORS[i],
      }))

      setFaturamento(faturamentoOrdenado)
      setServicos(servicosOrdenados)
      setFunil(funilData)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [instanceId, periodo])

  const totalFaturamento = useMemo(
    () => faturamento.reduce((sum, f) => sum + f.valor, 0),
    [faturamento]
  )

  if (!instanceId) {
    return <p className="text-sm text-gray-400">Selecione uma clínica para visualizar as estatísticas.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estatísticas</h1>
          <p className="text-sm text-brand-gray">Desempenho da clínica no período selecionado</p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          {([7, 30, 90] as PeriodoDias[]).map((dias) => (
            <button
              key={dias}
              onClick={() => setPeriodo(dias)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                periodo === dias ? 'bg-brand-primary text-white' : 'text-brand-gray'
              }`}
            >
              {dias} dias
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Faturamento por mês (realizados)</h2>
              <span className="text-sm font-semibold text-brand-primary">
                {formatCurrency(totalFaturamento)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={faturamento}>
                <defs>
                  <linearGradient id="faturamentoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA57A" stopOpacity={1} />
                    <stop offset="100%" stopColor="#8FD9C4" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="mes" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    fontSize: 13,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                  labelStyle={{ color: '#6b7280' }}
                />
                <Bar dataKey="valor" name="Faturamento" fill="url(#faturamentoGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Serviços mais agendados</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={servicos} layout="vertical" margin={{ left: 24 }}>
                <defs>
                  <linearGradient id="servicosGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8FD9C4" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0EA57A" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  stroke="#9ca3af"
                  fontSize={12}
                  width={120}
                  tickLine={false}
                  axisLine={false}
                />
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
                <Bar dataKey="total" name="Agendamentos" fill="url(#servicosGradient)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Funil de conversão</h2>
            <ResponsiveContainer width="100%" height={280}>
              <FunnelChart>
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
                <Funnel dataKey="value" data={funil} isAnimationActive>
                  <LabelList position="right" dataKey="name" fill="#374151" stroke="none" fontSize={12} />
                  <LabelList position="center" dataKey="value" fill="#fff" stroke="none" fontSize={13} />
                  {funil.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
