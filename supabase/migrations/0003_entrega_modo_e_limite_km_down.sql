alter table public.config_cliente drop constraint if exists config_cliente_entrega_valores_check;
alter table public.config_cliente drop constraint if exists config_cliente_entrega_modo_check;
alter table public.config_cliente
  drop column if exists entrega_max_km,
  drop column if exists taxa_entrega_fixa,
  drop column if exists entrega_modo;
