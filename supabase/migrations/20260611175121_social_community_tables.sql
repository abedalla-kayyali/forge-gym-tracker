-- Social/community backend: shared catalogs (meals + exercises) and duels.
--
-- Replaces the never-applied drafts in docs/supabase/ with tightened RLS:
--   * catalog writes are creator-owned (drafts let any authenticated user
--     edit anyone's entry)
--   * duels use uuid participants + ownership policies (drafts used spoofable
--     text-prefix LIKE matching with `with check (true)` on insert/update)
--   * profiles_public is intentionally NOT deployed — its draft exposed raw
--     emails to every authenticated user; matchmaking lookup needs a
--     privacy-safe design first.
--
-- Catalog reads are public (guest mode uses the anon key); all writes require
-- auth. Idempotent: safe to re-run.

create extension if not exists pgcrypto;

-- ── Community exercise catalog ───────────────────────────────────────────────
create table if not exists public.community_exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text not null unique,
  muscle text not null default 'core',
  equipment text not null default 'other',
  tip text not null default '',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_exercises_name_idx on public.community_exercises (lower(name));
create index if not exists community_exercises_muscle_idx on public.community_exercises (lower(muscle));

alter table public.community_exercises enable row level security;

drop policy if exists community_exercises_select_all on public.community_exercises;
create policy community_exercises_select_all on public.community_exercises
  for select to anon, authenticated using (true);

drop policy if exists community_exercises_insert_own on public.community_exercises;
create policy community_exercises_insert_own on public.community_exercises
  for insert to authenticated with check ((select auth.uid()) = created_by);

drop policy if exists community_exercises_update_own on public.community_exercises;
create policy community_exercises_update_own on public.community_exercises
  for update to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);

drop policy if exists community_exercises_delete_own on public.community_exercises;
create policy community_exercises_delete_own on public.community_exercises
  for delete to authenticated using ((select auth.uid()) = created_by);

-- ── Community meal catalog ───────────────────────────────────────────────────
create table if not exists public.community_meals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text not null unique,
  category text not null default '',
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_meals_name_idx on public.community_meals (lower(name));

alter table public.community_meals enable row level security;

drop policy if exists community_meals_select_all on public.community_meals;
create policy community_meals_select_all on public.community_meals
  for select to anon, authenticated using (true);

drop policy if exists community_meals_insert_own on public.community_meals;
create policy community_meals_insert_own on public.community_meals
  for insert to authenticated with check ((select auth.uid()) = created_by);

drop policy if exists community_meals_update_own on public.community_meals;
create policy community_meals_update_own on public.community_meals
  for update to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);

drop policy if exists community_meals_delete_own on public.community_meals;
create policy community_meals_delete_own on public.community_meals
  for delete to authenticated using ((select auth.uid()) = created_by);

-- ── Duels ────────────────────────────────────────────────────────────────────
create table if not exists public.forge_duels (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'sessions',
  target integer not null default 7,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'declined', 'completed', 'cancelled')),
  challenger_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  opponent_id uuid not null references auth.users(id) on delete cascade,
  challenger_score integer not null default 0,
  opponent_score integer not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forge_duels_distinct_participants check (challenger_id <> opponent_id)
);

create index if not exists forge_duels_challenger_idx on public.forge_duels (challenger_id, status);
create index if not exists forge_duels_opponent_idx on public.forge_duels (opponent_id, status);

alter table public.forge_duels enable row level security;

drop policy if exists forge_duels_select_participant on public.forge_duels;
create policy forge_duels_select_participant on public.forge_duels
  for select to authenticated
  using ((select auth.uid()) in (challenger_id, opponent_id));

drop policy if exists forge_duels_insert_challenger on public.forge_duels;
create policy forge_duels_insert_challenger on public.forge_duels
  for insert to authenticated
  with check ((select auth.uid()) = challenger_id);

drop policy if exists forge_duels_update_participant on public.forge_duels;
create policy forge_duels_update_participant on public.forge_duels
  for update to authenticated
  using ((select auth.uid()) in (challenger_id, opponent_id))
  with check ((select auth.uid()) in (challenger_id, opponent_id));

drop policy if exists forge_duels_delete_challenger on public.forge_duels;
create policy forge_duels_delete_challenger on public.forge_duels
  for delete to authenticated
  using ((select auth.uid()) = challenger_id);

-- ── Data API exposure ────────────────────────────────────────────────────────
-- Catalogs: public reads, authenticated writes. Duels: authenticated only;
-- anon gets SELECT so the app's anon-key existence probe returns 200 [] (RLS
-- yields zero rows) instead of a 404/401.
grant select on public.community_exercises, public.community_meals to anon, authenticated;
grant insert, update, delete on public.community_exercises, public.community_meals to authenticated;
grant select on public.forge_duels to anon;
grant select, insert, update, delete on public.forge_duels to authenticated;
