-- Generic custom fields — lets an admin add a select-style field to the Lead
-- or Orçamento forms from Configurações, without a code change per field.
-- v1 only supports a single choice from a fixed option list (covers the
-- concrete need: "Tipo de serviço" recorrente/eventual), so there is no
-- `tipo` column yet — every definition is implicitly a select field.

create type custom_field_entity as enum ('lead', 'orcamento');

create table custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  entidade custom_field_entity not null,
  chave text not null,
  rotulo text not null,
  opcoes jsonb not null default '[]'::jsonb, -- [{"valor": "...", "rotulo": "..."}, ...]
  usar_em_relatorios boolean not null default false,
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (entidade, chave)
);

create trigger custom_field_definitions_set_atualizado_em before update on custom_field_definitions
  for each row execute function set_atualizado_em();

alter table leads add column campos_customizados jsonb not null default '{}'::jsonb;
alter table quotes add column campos_customizados jsonb not null default '{}'::jsonb;

alter table custom_field_definitions enable row level security;

create policy "custom_field_definitions_staff_select" on custom_field_definitions
  for select to authenticated using (true);
create policy "custom_field_definitions_admin_write" on custom_field_definitions
  for all to authenticated using (is_admin()) with check (is_admin());

-- Seed the field the product actually needs today: leads are classified as
-- recorrente (contratado todo mês — limpeza de condomínio, recepção de
-- clínica) ou eventual (limpeza pós-obra, feiras, recepção de eventos, apoio
-- operacional pontual em CD). Flows straight into Orçamentos (filtro) and
-- Relatórios (ticket médio por tipo) via `usar_em_relatorios`.
insert into custom_field_definitions (entidade, chave, rotulo, opcoes, usar_em_relatorios, ordem)
values (
  'lead',
  'tipo_servico',
  'Tipo de serviço',
  '[{"valor": "recorrente", "rotulo": "Recorrente"}, {"valor": "eventual", "rotulo": "Eventual"}]'::jsonb,
  true,
  1
);
