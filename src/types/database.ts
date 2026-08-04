export type LeadStatus = 'novo_lead' | 'em_atendimento' | 'agendado' | 'compareceu' | 'perdido'
export type AgendamentoStatus = 'confirmado' | 'cancelado' | 'realizado'
export type ConversaRole = 'paciente' | 'ia'

export interface ConfigCliente {
  instance_id: string
  slug: string | null
  nome_empresa: string | null
  logo_url: string | null
  cor_primaria: string | null
  horario_funcionamento: string | null
  tom_voz: string | null
  numero_humano: string | null
}

export interface Servico {
  id: string
  instance_id: string
  nome: string
  descricao: string | null
  duracao_minutos: number
  valor: number
  ativo: boolean
}

export interface Profissional {
  id: string
  instance_id: string
  nome: string
  especialidade: string | null
}

export interface HorarioDisponivel {
  id: string
  profissional_id: string
  dia_semana: number // 0=domingo ... 6=sabado
  hora_inicio: string // HH:mm:ss
  hora_fim: string
}

export interface LeadPaciente {
  id: string
  instance_id: string
  telefone: string
  nome: string | null
  status: LeadStatus
  observacoes: string | null
  criado_em: string
  atualizado_em: string
}

export interface Agendamento {
  id: string
  instance_id: string
  lead_id: string
  servico_id: string | null
  profissional_id: string | null
  data_hora: string
  status: AgendamentoStatus
  criado_via: string | null
  criado_em: string
}

export interface Conversa {
  id: number
  instance_id: string
  telefone: string
  role: ConversaRole
  mensagem: string
  tipo: string
  criado_em: string
}

export interface AgendamentoDetalhado extends Agendamento {
  lead?: LeadPaciente | null
  servico?: Servico | null
  profissional?: Profissional | null
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo_lead: 'Novo Lead',
  em_atendimento: 'Em Atendimento',
  agendado: 'Agendado',
  compareceu: 'Compareceu',
  perdido: 'Perdido',
}

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  'novo_lead',
  'em_atendimento',
  'agendado',
  'compareceu',
  'perdido',
]

export const AGENDAMENTO_STATUS_LABELS: Record<AgendamentoStatus, string> = {
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  realizado: 'Realizado',
}
