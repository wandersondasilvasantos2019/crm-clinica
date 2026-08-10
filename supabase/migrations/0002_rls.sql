-- 0002_rls.sql
-- Ativa Row Level Security nas tabelas de tenant + na tabela usuarios, e
-- cria as politicas de acesso por instance_id (admin ve tudo, cliente ve so
-- o proprio tenant).
--
-- Confirmado com o dono do projeto: o n8n (agente de WhatsApp) usa a
-- service_role key, que ignora RLS por definicao — nenhuma politica extra
-- e' necessaria para o n8n continuar funcionando.
--
-- Uso duas funcoes SECURITY DEFINER (is_admin / my_instance_id) em vez de
-- repetir "exists (select 1 from usuarios where ...)" em cada politica.
-- Alem de reduzir duplicacao, isso evita qualquer ambiguidade de RLS
-- recursiva na propria tabela usuarios (a funcao roda com privilegio do
-- dono, ignorando RLS internamente, exatamente como a documentacao do
-- Supabase recomenda para esse caso).
--
-- Rollback: 0002_rls_down.sql

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.usuarios
    where usuarios.id = auth.uid() and usuarios.role = 'admin'
  );
$$;

create or replace function public.my_instance_id()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select instance_id from public.usuarios where usuarios.id = auth.uid();
$$;

-- usuarios: cada um ve a propria linha; admin ve todas.
alter table public.usuarios enable row level security;

create policy "usuarios_acesso"
on public.usuarios
for all
using (
  id = auth.uid() or public.is_admin()
);

-- config_cliente: a "instance_id" da propria tabela e' a chave.
-- select/insert/update liberados pra admin ou pro dono do tenant; delete
-- restrito a admin via politica RESTRICTIVE (combina em AND com a
-- permissiva abaixo — sem ela, a "for all" ja deixaria qualquer cliente
-- apagar a propria linha, ja que policies permissivas se combinam em OR).
alter table public.config_cliente enable row level security;

create policy "acesso_por_instance_id"
on public.config_cliente
for all
using (
  public.is_admin() or config_cliente.instance_id = public.my_instance_id()
);

create policy "delete_somente_admin"
on public.config_cliente
as restrictive
for delete
using (
  public.is_admin()
);

-- servicos, profissionais, agendamentos, leads_pacientes, conversas:
-- todas tem instance_id direto.
alter table public.servicos enable row level security;

create policy "acesso_por_instance_id"
on public.servicos
for all
using (
  public.is_admin() or servicos.instance_id = public.my_instance_id()
);

alter table public.profissionais enable row level security;

create policy "acesso_por_instance_id"
on public.profissionais
for all
using (
  public.is_admin() or profissionais.instance_id = public.my_instance_id()
);

alter table public.agendamentos enable row level security;

create policy "acesso_por_instance_id"
on public.agendamentos
for all
using (
  public.is_admin() or agendamentos.instance_id = public.my_instance_id()
);

alter table public.leads_pacientes enable row level security;

create policy "acesso_por_instance_id"
on public.leads_pacientes
for all
using (
  public.is_admin() or leads_pacientes.instance_id = public.my_instance_id()
);

alter table public.conversas enable row level security;

create policy "acesso_por_instance_id"
on public.conversas
for all
using (
  public.is_admin() or conversas.instance_id = public.my_instance_id()
);

-- horarios_disponiveis: nao tem instance_id direto, so profissional_id.
-- precisa de join com profissionais pra achar o tenant dono do horario.
alter table public.horarios_disponiveis enable row level security;

create policy "acesso_por_instance_id"
on public.horarios_disponiveis
for all
using (
  public.is_admin() or exists (
    select 1 from public.profissionais p
    where p.id = horarios_disponiveis.profissional_id
    and p.instance_id = public.my_instance_id()
  )
);
