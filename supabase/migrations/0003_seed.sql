-- Auto-create a profile row whenever a new auth.users record is created
-- (e.g. when Caio or Ana Milla are invited/signed up via Supabase Auth).
-- New profiles default to the least-privileged role; promote to admin
-- explicitly afterwards (see instructions below).

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', new.email), new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Default settings used by the AI agent and the funnel-stage SLA badges.
-- Edit these from the Configurações screen once the app is running — this
-- seed only ensures the keys exist so the UI has something to read on first
-- load.

insert into settings (chave, valor) values
  ('horario_atendimento', '{
    "timezone": "America/Fortaleza",
    "dias": {
      "segunda": {"inicio": "08:00", "fim": "18:00"},
      "terca": {"inicio": "08:00", "fim": "18:00"},
      "quarta": {"inicio": "08:00", "fim": "18:00"},
      "quinta": {"inicio": "08:00", "fim": "18:00"},
      "sexta": {"inicio": "08:00", "fim": "18:00"},
      "sabado": null,
      "domingo": null
    }
  }'::jsonb),
  ('script_qualificacao', '{
    "perguntas": [
      {"ordem": 1, "pergunta": "Qual o tipo de serviço que você precisa (limpeza predial, pós-obra, portaria, jardinagem, etc.)?"},
      {"ordem": 2, "pergunta": "Qual o endereço/local do serviço?"},
      {"ordem": 3, "pergunta": "Qual a metragem ou porte do local?"},
      {"ordem": 4, "pergunta": "Com que frequência o serviço será prestado (diário, semanal, avulso)?"},
      {"ordem": 5, "pergunta": "Qual o prazo desejado para início?"}
    ]
  }'::jsonb),
  ('gatilhos_followup', '{
    "sem_resposta_qualificacao_horas": 24,
    "orcamento_enviado_sem_retorno_dias": 3
  }'::jsonb),
  ('limites_etapa_funil_dias', '{
    "novo_lead": 1,
    "qualificacao": 2,
    "orcamento_em_elaboracao": 2,
    "orcamento_aguardando_aprovacao": 1,
    "orcamento_enviado": 3,
    "negociacao": 5,
    "contrato_em_elaboracao": 2,
    "contrato_aguardando_aprovacao": 1,
    "aguardando_assinatura": 5
  }'::jsonb)
on conflict (chave) do nothing;

-- ---------------------------------------------------------------------------
-- Manual step after running this migration:
--
-- 1. Create the two staff accounts in Supabase Auth (Studio > Authentication
--    > Add user, or supabase.auth.admin.createUser from a trusted script).
--    The trigger above creates a matching `profiles` row automatically.
-- 2. Promote Caio to admin with full approval rights:
--
--      update profiles
--      set perfil = 'admin',
--          pode_aprovar_contrato = true,
--          limite_aprovacao_orcamento = 999999999
--      where email = 'caio_silvestre@hotmail.com';
--
-- 3. Set Ana Milla's approval limit (comercial/financeiro — pode aprovar
--    orçamento até um teto, nunca contrato):
--
--      update profiles
--      set pode_aprovar_contrato = false,
--          limite_aprovacao_orcamento = 15000
--      where email = 'EMAIL_DA_ANA_MILLA_AQUI';
--
--    Both fields are editable later from Configurações > Usuários.
-- ---------------------------------------------------------------------------
