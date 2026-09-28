export type LeadStatus = 'novo_lead' | 'em_atendimento' | 'agendado' | 'compareceu' | 'perdido'
export type AgendamentoStatus = 'confirmado' | 'cancelado' | 'compareceu' | 'faltou'
export type ConversaRole = 'paciente' | 'ia'
export type UsuarioRole = 'admin' | 'cliente'
export type TipoNegocio = 'agendamento' | 'pedidos'
export type StatusPedido = 'novo' | 'confirmado' | 'preparando' | 'entregue' | 'cancelado'
export type AlertaSom = 'alarme' | 'campainha' | 'bipe' | 'suave'

export interface Usuario {
  id: string
  instance_id: string | null
  role: UsuarioRole
  criado_em: string
}

export interface ConfigCliente {
  instance_id: string
  slug: string | null
  nome_empresa: string | null
  logo_url: string | null
  cor_primaria: string | null
  horario_funcionamento: string | null
  tom_voz: string | null
  numero_humano: string | null
  tipo_negocio: TipoNegocio
  alerta_som: AlertaSom | null
  alerta_volume: number | null
  alerta_intervalo_s: number | null
  // Vertical de pedidos — usados pela IA ao fechar o pedido.
  endereco: string | null
  taxa_entrega_por_km: number | null
  formas_pagamento: string | null
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

export interface ItemCardapio {
  id: string
  instance_id: string
  nome: string
  descricao: string | null
  preco: number
  categoria: string | null
  ativo: boolean
  criado_em: string
}

export interface ItemPedido {
  id: string
  pedido_id: string
  item_cardapio_id: string | null
  nome_item: string
  quantidade: number
  preco_unitario: number
  criado_em: string
}

export interface Pedido {
  id: string
  instance_id: string
  telefone: string
  nome_cliente: string | null
  status: StatusPedido
  tipo_entrega: 'retirada' | 'entrega' | null
  endereco_entrega: string | null
  observacoes: string | null
  total: number
  criado_via: string
  criado_em: string
  atualizado_em: string
  aceito_em: string | null
}

export interface PedidoComItens extends Pedido {
  itens_pedido: ItemPedido[]
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
  compareceu: 'Compareceu',
  faltou: 'Faltou',
}

export const STATUS_PEDIDO_LABELS: Record<StatusPedido, string> = {
  novo: 'Novo',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

// Fluxo principal do Kanban — 'cancelado' fica fora e aparece numa coluna separada no fim.
export const STATUS_PEDIDO_FLUXO: StatusPedido[] = ['novo', 'confirmado', 'preparando', 'entregue']
