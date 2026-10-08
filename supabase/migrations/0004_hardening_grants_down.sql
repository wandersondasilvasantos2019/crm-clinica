-- Reverte a Migration A (devolve os privilegios amplos originais).
alter table public.config_cliente drop constraint if exists config_cliente_taxa_por_km_check;
grant update on public.config_cliente to authenticated;
grant insert, update, delete on public.config_cliente, public.servicos, public.profissionais,
  public.horarios_disponiveis, public.ofertas to anon;
grant update, delete on public.agendamentos to anon;
grant delete on public.leads_pacientes to anon;
grant all on public.contatos_disparo, public.conversas, public.itens_cardapio, public.itens_pedido, public.leads,
  public.leads_trafego, public.n8n_chat_histories, public.pagamentos, public.pedidos, public.prospects_negocios,
  public.usuarios to anon;
grant truncate, trigger, references on all tables in schema public to anon, authenticated;
