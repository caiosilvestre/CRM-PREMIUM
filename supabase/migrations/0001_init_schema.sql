-- Premium Services CRM — initial schema
-- Entities per project spec: profiles, leads, conversations, messages, quotes,
-- contracts, approvals, followups, templates, pricing_rules, activity_log,
-- finance_sync_log, settings.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type user_role as enum ('admin', 'comercial_financeiro');

create type funnel_stage as enum (
  'novo_lead',
  'qualificacao',
  'orcamento_em_elaboracao',
  'orcamento_aguardando_aprovacao',
  'orcamento_enviado',
  'negociacao',
  'contrato_em_elaboracao',
  'contrato_aguardando_aprovacao',
  'aguardando_assinatura',
  'fechado',
  'perdido'
);

create type lead_origin as enum ('whatsapp', 'indicacao', 'site', 'outro');

create type conversation_mode as enum ('ia', 'humano');

create type message_sender as enum ('cliente', 'ia', 'humano');

create type quote_status as enum (
  'rascunho',
  'aguardando_aprovacao',
  'aprovado',
  'aprovado_com_ajuste',
  'reprovado',
  'enviado'
);

create type contract_signature_status as enum (
  'rascunho',
  'aguardando_aprovacao',
  'aprovado',
  'aguardando_assinatura',
  'assinado'
);

create type approval_type as enum ('orcamento', 'contrato');

create type approval_status as enum ('pendente', 'aprovado', 'aprovado_com_ajuste', 'reprovado');

create type followup_status as enum ('pendente', 'concluido', 'atrasado');

create type template_type as enum ('orcamento', 'contrato');

create type finance_sync_status as enum ('pendente_integracao', 'sincronizado', 'erro');

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null unique,
  perfil user_role not null default 'comercial_financeiro',
  limite_aprovacao_orcamento numeric(12, 2) not null default 0,
  pode_aprovar_contrato boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------

create table leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  contato_telefone text,
  contato_email text,
  origem lead_origin not null default 'whatsapp',
  etapa_funil funnel_stage not null default 'novo_lead',
  etapa_atualizada_em timestamptz not null default now(),
  valor_estimado numeric(12, 2),
  responsavel_id uuid references profiles (id),
  proxima_acao_descricao text,
  proxima_acao_data timestamptz,
  proxima_acao_responsavel_id uuid references profiles (id),
  motivo_perda text,
  motivo_perda_detalhe text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index leads_etapa_funil_idx on leads (etapa_funil);
create index leads_responsavel_idx on leads (responsavel_id);

-- ---------------------------------------------------------------------------
-- conversations & messages
-- ---------------------------------------------------------------------------

create table conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  canal text not null default 'whatsapp',
  modo conversation_mode not null default 'ia',
  assumida_por uuid references profiles (id),
  ultima_mensagem_em timestamptz,
  criado_em timestamptz not null default now()
);

create index conversations_lead_idx on conversations (lead_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  remetente message_sender not null,
  autor_id uuid references profiles (id),
  texto text not null,
  criado_em timestamptz not null default now()
);

create index messages_conversation_idx on messages (conversation_id, criado_em);

-- ---------------------------------------------------------------------------
-- templates & pricing_rules
-- ---------------------------------------------------------------------------

create table templates (
  id uuid primary key default gen_random_uuid(),
  tipo template_type not null,
  nome text not null,
  conteudo text not null,
  versao integer not null default 1,
  criado_por uuid references profiles (id),
  atualizado_em timestamptz not null default now()
);

create table pricing_rules (
  id uuid primary key default gen_random_uuid(),
  servico text not null,
  unidade text not null,
  preco numeric(12, 2) not null,
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- quotes & contracts
-- ---------------------------------------------------------------------------

create table quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  template_id uuid references templates (id),
  itens jsonb not null default '[]'::jsonb,
  condicoes text,
  valor_total numeric(12, 2) not null default 0,
  status quote_status not null default 'rascunho',
  versao integer not null default 1,
  criado_por uuid references profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index quotes_lead_idx on quotes (lead_id);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  quote_id uuid references quotes (id),
  template_id uuid references templates (id),
  campos jsonb not null default '{}'::jsonb,
  status_assinatura contract_signature_status not null default 'rascunho',
  arquivo_url text,
  assinado_em timestamptz,
  criado_por uuid references profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index contracts_lead_idx on contracts (lead_id);

-- ---------------------------------------------------------------------------
-- approvals — records every approval/rejection decision with author and reason
-- ---------------------------------------------------------------------------

create table approvals (
  id uuid primary key default gen_random_uuid(),
  tipo approval_type not null,
  referencia_id uuid not null,
  solicitante_id uuid references profiles (id),
  motivo text,
  exclusivo_admin boolean not null default false,
  status approval_status not null default 'pendente',
  decidido_por uuid references profiles (id),
  decidido_em timestamptz,
  motivo_decisao text,
  criado_em timestamptz not null default now()
);

create index approvals_status_idx on approvals (status);
create index approvals_referencia_idx on approvals (tipo, referencia_id);

-- ---------------------------------------------------------------------------
-- followups
-- ---------------------------------------------------------------------------

create table followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  descricao text not null,
  data timestamptz not null,
  responsavel_id uuid references profiles (id),
  status followup_status not null default 'pendente',
  concluido_em timestamptz,
  criado_em timestamptz not null default now()
);

create index followups_lead_idx on followups (lead_id);
create index followups_status_idx on followups (status);

-- ---------------------------------------------------------------------------
-- activity_log — append-only audit trail
-- ---------------------------------------------------------------------------

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid references profiles (id),
  acao text not null,
  referencia_tipo text,
  referencia_id uuid,
  detalhe jsonb,
  criado_em timestamptz not null default now()
);

create index activity_log_referencia_idx on activity_log (referencia_tipo, referencia_id);

-- ---------------------------------------------------------------------------
-- finance_sync_log — prepared for future Conta Azul integration
-- ---------------------------------------------------------------------------

create table finance_sync_log (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts (id) on delete cascade,
  provider text not null default 'conta_azul',
  status finance_sync_status not null default 'pendente_integracao',
  payload jsonb,
  criado_em timestamptz not null default now()
);

create index finance_sync_log_contract_idx on finance_sync_log (contract_id);

-- ---------------------------------------------------------------------------
-- settings — generic key/value store (horario_atendimento, script_qualificacao,
-- gatilhos_followup, etc.)
-- ---------------------------------------------------------------------------

create table settings (
  chave text primary key,
  valor jsonb not null,
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at helper trigger
-- ---------------------------------------------------------------------------

create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_atualizado_em before update on profiles
  for each row execute function set_atualizado_em();

create or replace function leads_before_update()
returns trigger as $$
begin
  new.atualizado_em = now();
  if new.etapa_funil is distinct from old.etapa_funil then
    new.etapa_atualizada_em = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger leads_before_update before update on leads
  for each row execute function leads_before_update();

create trigger quotes_set_atualizado_em before update on quotes
  for each row execute function set_atualizado_em();
create trigger contracts_set_atualizado_em before update on contracts
  for each row execute function set_atualizado_em();
create trigger templates_set_atualizado_em before update on templates
  for each row execute function set_atualizado_em();
create trigger pricing_rules_set_atualizado_em before update on pricing_rules
  for each row execute function set_atualizado_em();
create trigger settings_set_atualizado_em before update on settings
  for each row execute function set_atualizado_em();
