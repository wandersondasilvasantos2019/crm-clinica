-- Rollback de 0002_rls.sql

drop policy if exists "acesso_por_instance_id" on public.horarios_disponiveis;
alter table public.horarios_disponiveis disable row level security;

drop policy if exists "acesso_por_instance_id" on public.conversas;
alter table public.conversas disable row level security;

drop policy if exists "acesso_por_instance_id" on public.leads_pacientes;
alter table public.leads_pacientes disable row level security;

drop policy if exists "acesso_por_instance_id" on public.agendamentos;
alter table public.agendamentos disable row level security;

drop policy if exists "acesso_por_instance_id" on public.profissionais;
alter table public.profissionais disable row level security;

drop policy if exists "acesso_por_instance_id" on public.servicos;
alter table public.servicos disable row level security;

drop policy if exists "acesso_por_instance_id" on public.config_cliente;
alter table public.config_cliente disable row level security;

drop policy if exists "usuarios_acesso" on public.usuarios;
alter table public.usuarios disable row level security;

drop function if exists public.my_instance_id();
drop function if exists public.is_admin();
