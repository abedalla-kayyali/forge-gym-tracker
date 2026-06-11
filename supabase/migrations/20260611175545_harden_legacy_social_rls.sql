-- Harden RLS on the LIVE legacy social tables (deployed long ago from the
-- docs/supabase drafts; flagged by `supabase db advisors` and a prior audit).
--
-- 1) profiles_public stored raw emails SELECTable by every authenticated user
--    (live PII exposure — all rows had emails). Switch to column-level SELECT
--    grants that exclude `email`. Owners can still write their row; nothing
--    can read emails back through the Data API.
--
-- 2) duels had `WITH CHECK (true)` on insert AND update — any authenticated
--    user could create or rewrite any duel. Bind inserts to the challenger
--    and updates to the participants, matching the existing select policy's
--    legacy text-id scheme.
--
-- Idempotent: safe to re-run.

-- ── profiles_public: hide email from the Data API ────────────────────────────
revoke select on public.profiles_public from anon, authenticated;
grant select (id, name, display_name, duel_public_stats, updated_at)
  on public.profiles_public to authenticated;

-- ── duels: participant-bound writes ──────────────────────────────────────────
-- (select policy recreated too: the original re-evaluated auth.uid() per row)
drop policy if exists duels_participant_select on public.duels;
create policy duels_participant_select on public.duels
  for select to authenticated
  using (
    challenger like (replace((select auth.uid())::text, '-', '') || '%') or
    opponent like (replace((select auth.uid())::text, '-', '') || '%') or
    challenger ilike ((select auth.uid())::text || '%') or
    opponent ilike ((select auth.uid())::text || '%')
  );

drop policy if exists duels_authenticated_insert on public.duels;
create policy duels_authenticated_insert on public.duels
  for insert to authenticated
  with check (
    challenger like (replace((select auth.uid())::text, '-', '') || '%') or
    challenger ilike ((select auth.uid())::text || '%')
  );

drop policy if exists duels_participant_update on public.duels;
create policy duels_participant_update on public.duels
  for update to authenticated
  using (
    challenger like (replace((select auth.uid())::text, '-', '') || '%') or
    opponent like (replace((select auth.uid())::text, '-', '') || '%') or
    challenger ilike ((select auth.uid())::text || '%') or
    opponent ilike ((select auth.uid())::text || '%')
  )
  with check (
    challenger like (replace((select auth.uid())::text, '-', '') || '%') or
    opponent like (replace((select auth.uid())::text, '-', '') || '%') or
    challenger ilike ((select auth.uid())::text || '%') or
    opponent ilike ((select auth.uid())::text || '%')
  );
