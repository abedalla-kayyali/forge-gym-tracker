-- FORGE offline-first sync table.
-- One row per (user, logical key). Value is JSONB to keep all local stores
-- (workouts / bwWorkouts / cardio / profile / nutrition / settings / …) in a
-- single lightweight schema. Last-writer-wins reconciliation via updated_at.

create table if not exists public.user_data (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  key        text        not null,
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Keep updated_at fresh on every upsert
create or replace function public.user_data_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_data_updated_at on public.user_data;
create trigger trg_user_data_updated_at
before update on public.user_data
for each row execute function public.user_data_touch_updated_at();

-- RLS — users can only read / write their own rows
alter table public.user_data enable row level security;

drop policy if exists user_data_select_own on public.user_data;
create policy user_data_select_own
on public.user_data for select
using (auth.uid() = user_id);

drop policy if exists user_data_insert_own on public.user_data;
create policy user_data_insert_own
on public.user_data for insert
with check (auth.uid() = user_id);

drop policy if exists user_data_update_own on public.user_data;
create policy user_data_update_own
on public.user_data for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists user_data_delete_own on public.user_data;
create policy user_data_delete_own
on public.user_data for delete
using (auth.uid() = user_id);

-- Helpful index for per-user lookups (primary key already covers user_id+key
-- but this helps range-scans by key when debugging)
create index if not exists idx_user_data_key on public.user_data (key);

comment on table public.user_data is
  'FORGE local-first sync. Each row is one zustand store slice keyed by name.';
