-- Migration A: endurecimento de privilegios (aplicada em producao).
-- S5: cliente so atualiza as colunas que o painel realmente grava
revoke update on public.config_cliente from authenticated;
grant update (nome_empresa, horario_funcionamento, tom_voz, numero_humano, endereco, formas_pagamento,
              taxa_entrega_por_km, taxa_entrega_fixa, entrega_modo, entrega_max_km,
              alerta_som, alerta_volume, alerta_intervalo_s) on public.config_cliente to authenticated;
-- B5: taxa por km nao pode ser negativa
alter table public.config_cliente add constraint config_cliente_taxa_por_km_check
  check (taxa_entrega_por_km is null or taxa_entrega_por_km >= 0);
-- Defesa em profundidade: remove privilegios que ninguem usa
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;
revoke all on public.contatos_disparo, public.conversas, public.itens_cardapio, public.itens_pedido, public.leads,
  public.leads_trafego, public.n8n_chat_histories, public.pagamentos, public.pedidos, public.prospects_negocios,
  public.usuarios from anon;
revoke insert, update, delete on public.config_cliente, public.servicos, public.profissionais,
  public.horarios_disponiveis, public.ofertas from anon;
revoke update, delete on public.agendamentos from anon;
revoke delete on public.leads_pacientes from anon;
