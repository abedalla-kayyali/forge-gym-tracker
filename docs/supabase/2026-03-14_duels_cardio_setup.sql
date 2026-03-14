-- FORGE Supabase setup for duels/cardio + public athlete lookup.
-- Run in Supabase SQL editor for project: mnqetnzdgtbeysqnmbkx

create extension if not exists pgcrypto;

-- 1) Cardio table (required by sync.js)
create table if not exists public.cardio (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cardio_user_date_idx on public.cardio(user_id, date desc);

alter table public.cardio enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='cardio' and policyname='cardio_select_own'
  ) then
    create policy cardio_select_own on public.cardio
      for select to authenticated using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='cardio' and policyname='cardio_insert_own'
  ) then
    create policy cardio_insert_own on public.cardio
      for insert to authenticated with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='cardio' and policyname='cardio_update_own'
  ) then
    create policy cardio_update_own on public.cardio
      for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='cardio' and policyname='cardio_delete_own'
  ) then
    create policy cardio_delete_own on public.cardio
      for delete to authenticated using (auth.uid() = user_id);
  end if;
end $$;

-- 2) Duels table (app probes forge_duels first, then duels)
create table if not exists public.duels (
  id text primary key,
  mode text not null default 'scope:workout',
  target integer not null default 7,
  status text not null default 'pending',
  challenger text not null,
  opponent text not null,
  score_self integer not null default 0,
  score_opponent integer not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists duels_status_idx on public.duels(status, updated_at desc);
create index if not exists duels_challenger_idx on public.duels(challenger);
create index if not exists duels_opponent_idx on public.duels(opponent);

alter table public.duels enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='duels' and policyname='duels_participant_select'
  ) then
    create policy duels_participant_select on public.duels
      for select to authenticated
      using (
        challenger like (replace(auth.uid()::text, '-', '') || '%') or
        opponent like (replace(auth.uid()::text, '-', '') || '%') or
        challenger ilike (auth.uid()::text || '%') or
        opponent ilike (auth.uid()::text || '%')
      );
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='duels' and policyname='duels_authenticated_insert'
  ) then
    create policy duels_authenticated_insert on public.duels
      for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='duels' and policyname='duels_participant_update'
  ) then
    create policy duels_participant_update on public.duels
      for update to authenticated
      using (
        challenger like (replace(auth.uid()::text, '-', '') || '%') or
        opponent like (replace(auth.uid()::text, '-', '') || '%') or
        challenger ilike (auth.uid()::text || '%') or
        opponent ilike (auth.uid()::text || '%')
      )
      with check (true);
  end if;
end $$;

-- 3) Public searchable profile table for duel matchmaking
create table if not exists public.profiles_public (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  display_name text not null default '',
  email text not null default '',
  duel_public_stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists profiles_public_name_idx on public.profiles_public(lower(name));
create index if not exists profiles_public_email_idx on public.profiles_public(lower(email));

alter table public.profiles_public enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles_public' and policyname='profiles_public_select_all_auth'
  ) then
    create policy profiles_public_select_all_auth on public.profiles_public
      for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles_public' and policyname='profiles_public_insert_own'
  ) then
    create policy profiles_public_insert_own on public.profiles_public
      for insert to authenticated with check (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles_public' and policyname='profiles_public_update_own'
  ) then
    create policy profiles_public_update_own on public.profiles_public
      for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

