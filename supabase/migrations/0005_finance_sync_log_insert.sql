-- 0002_rls_policies.sql gave staff read access to finance_sync_log but never
-- an insert policy, so markContractSigned's insert (src/lib/data/store.ts)
-- would be silently blocked by RLS once the app writes real rows instead of
-- mock ones.

create policy "finance_sync_log_staff_insert" on finance_sync_log
  for insert to authenticated with check (true);
