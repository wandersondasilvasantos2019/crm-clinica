-- Reverte 0005_instrucoes_agente.
revoke update (instrucoes_agente) on public.config_cliente from authenticated;
alter table public.config_cliente drop constraint if exists config_cliente_instrucoes_agente_check;
alter table public.config_cliente drop column if exists instrucoes_agente;
