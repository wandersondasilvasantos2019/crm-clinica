-- Vertical de pedidos: taxa fixa OU por km, e distância máxima de entrega.
alter table public.config_cliente
  add column if not exists entrega_modo text not null default 'por_km',
  add column if not exists taxa_entrega_fixa numeric,
  add column if not exists entrega_max_km numeric;

alter table public.config_cliente
  drop constraint if exists config_cliente_entrega_modo_check;
alter table public.config_cliente
  add constraint config_cliente_entrega_modo_check check (entrega_modo in ('por_km','fixa'));

alter table public.config_cliente
  drop constraint if exists config_cliente_entrega_valores_check;
alter table public.config_cliente
  add constraint config_cliente_entrega_valores_check check (
    (taxa_entrega_fixa is null or taxa_entrega_fixa >= 0) and
    (entrega_max_km is null or entrega_max_km > 0)
  );
