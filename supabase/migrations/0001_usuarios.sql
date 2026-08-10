-- 0001_usuarios.sql
-- Cria a tabela de vinculo entre auth.users e o tenant (config_cliente),
-- com o papel (role) de cada usuario: admin (sem clinica fixa) ou cliente
-- (preso a uma instance_id).
--
-- Rollback: 0001_usuarios_down.sql

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  instance_id text references public.config_cliente(instance_id),
  role text not null check (role in ('admin', 'cliente')),
  criado_em timestamptz default now(),
  constraint usuarios_role_instance_ck check (
    (role = 'admin' and instance_id is null) or
    (role = 'cliente' and instance_id is not null)
  )
);

comment on table public.usuarios is
  'Vinculo 1:1 com auth.users. role=admin enxerga todos os tenants (instance_id nulo); role=cliente fica preso ao proprio instance_id.';

-- Troque o e-mail abaixo pelo e-mail que voce usa hoje pra logar no CRM
-- (o mesmo da tela /login). Isso cria voce como o primeiro admin.
-- Se o e-mail nao corresponder a nenhum usuario em auth.users, o insert
-- simplesmente nao insere nenhuma linha (sem erro) — confira o e-mail e
-- rode de novo nesse caso.
insert into public.usuarios (id, role, instance_id)
select id, 'admin', null
from auth.users
where email = 'admin@admin.com'
on conflict (id) do nothing;
