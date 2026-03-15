create table if not exists public.community_exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text not null unique,
  muscle text not null default 'Core',
  equipment text not null default 'other',
  tip text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_exercises_name_idx on public.community_exercises(lower(name));
create index if not exists community_exercises_muscle_idx on public.community_exercises(lower(muscle));

create table if not exists public.community_meals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text not null unique,
  category text not null default '',
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_meals_name_idx on public.community_meals(lower(name));

alter table public.community_exercises enable row level security;
alter table public.community_meals enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'community_exercises' and policyname = 'community_exercises_select_all_auth'
  ) then
    create policy community_exercises_select_all_auth on public.community_exercises
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'community_exercises' and policyname = 'community_exercises_insert_auth'
  ) then
    create policy community_exercises_insert_auth on public.community_exercises
      for insert to authenticated with check (auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'community_exercises' and policyname = 'community_exercises_update_auth'
  ) then
    create policy community_exercises_update_auth on public.community_exercises
      for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'community_meals' and policyname = 'community_meals_select_all_auth'
  ) then
    create policy community_meals_select_all_auth on public.community_meals
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'community_meals' and policyname = 'community_meals_insert_auth'
  ) then
    create policy community_meals_insert_auth on public.community_meals
      for insert to authenticated with check (auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'community_meals' and policyname = 'community_meals_update_auth'
  ) then
    create policy community_meals_update_auth on public.community_meals
      for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
end $$;
