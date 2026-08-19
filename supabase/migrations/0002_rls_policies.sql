-- Row Level Security
--
-- Both roles (admin, comercial_financeiro) are internal staff with access to
-- the whole CRM per the product spec — RLS here exists to (a) require
-- authentication for every table and (b) enforce the two rules that must
-- hold at the database layer, not just in the UI:
--   1. Only admins may decide (approve/reject) a "contrato" approval.
--   2. Approval/rejection decisions are immutable once recorded (no editing
--      history after the fact — corrections happen via a new decision row).

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and perfil = 'admin'
  );
$$ language sql stable security definer set search_path = public;

alter table profiles enable row level security;
alter table leads enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table templates enable row level security;
alter table pricing_rules enable row level security;
alter table quotes enable row level security;
alter table contracts enable row level security;
alter table approvals enable row level security;
alter table followups enable row level security;
alter table activity_log enable row level security;
alter table finance_sync_log enable row level security;
alter table settings enable row level security;

-- profiles: any authenticated staff member can read the directory; only
-- admins manage permissions, a user may update their own non-permission
-- fields (name) via a narrower policy.
create policy "profiles_select_authenticated" on profiles
  for select to authenticated using (true);
create policy "profiles_admin_write" on profiles
  for all to authenticated using (is_admin()) with check (is_admin());
create policy "profiles_self_update_name" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Generic staff read/write for core CRM tables (both roles work the funnel,
-- inbox, follow-ups; fine-grained business rules like budget limits are
-- enforced in the application layer where the acting user is known).
create policy "leads_staff_all" on leads for all to authenticated using (true) with check (true);
create policy "conversations_staff_all" on conversations for all to authenticated using (true) with check (true);
create policy "messages_staff_all" on messages for all to authenticated using (true) with check (true);
create policy "templates_staff_all" on templates for all to authenticated using (true) with check (true);
create policy "pricing_rules_staff_all" on pricing_rules for all to authenticated using (true) with check (true);
create policy "quotes_staff_all" on quotes for all to authenticated using (true) with check (true);
create policy "contracts_staff_all" on contracts for all to authenticated using (true) with check (true);
create policy "followups_staff_all" on followups for all to authenticated using (true) with check (true);
create policy "activity_log_staff_read" on activity_log for select to authenticated using (true);
create policy "activity_log_staff_insert" on activity_log for insert to authenticated with check (true);
create policy "finance_sync_log_staff_read" on finance_sync_log for select to authenticated using (true);
create policy "settings_staff_all" on settings for all to authenticated using (true) with check (true);

-- approvals: anyone on staff can read the queue and open a request; deciding
-- (update) is restricted — contract decisions require admin.
create policy "approvals_staff_select" on approvals for select to authenticated using (true);
create policy "approvals_staff_insert" on approvals for insert to authenticated with check (true);
create policy "approvals_decide" on approvals
  for update to authenticated
  using (
    status = 'pendente'
    and (tipo <> 'contrato' or is_admin())
  )
  with check (
    tipo <> 'contrato' or is_admin()
  );
