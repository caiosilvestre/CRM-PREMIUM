-- Security hardening flagged by Supabase's advisor after applying 0001-0003:
-- pin search_path on the two updated_at trigger functions (mutable
-- search_path is a known privilege-escalation vector for SECURITY DEFINER
-- and trigger functions), and stop handle_new_user from being callable
-- directly via PostgREST RPC — it's only meant to run through the
-- on_auth_user_created trigger.

create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create or replace function leads_before_update()
returns trigger as $$
begin
  new.atualizado_em = now();
  if new.etapa_funil is distinct from old.etapa_funil then
    new.etapa_atualizada_em = now();
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

revoke execute on function handle_new_user() from anon, authenticated;
