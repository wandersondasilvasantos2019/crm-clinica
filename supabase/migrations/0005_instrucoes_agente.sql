-- Instrucoes livres do dono para o agente (registro; ja aplicada em producao).
alter table public.config_cliente add column if not exists instrucoes_agente text;
alter table public.config_cliente drop constraint if exists config_cliente_instrucoes_agente_check;
alter table public.config_cliente add constraint config_cliente_instrucoes_agente_check
  check (instrucoes_agente is null or char_length(instrucoes_agente) <= 2000);
grant update (instrucoes_agente) on public.config_cliente to authenticated;
