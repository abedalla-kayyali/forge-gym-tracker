-- FORGE RAG: pgvector embeddings table
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Enable pgvector extension
create extension if not exists vector with schema extensions;

-- 2. Create embeddings table
create table if not exists public.forge_embeddings (
  id          text        primary key,           -- e.g. "workout_1710000000000"
  user_id     uuid        not null references auth.users(id) on delete cascade,
  type        text        not null,              -- 'workout' | 'meal' | 'cardio' | 'bodyweight' | 'bw_workout'
  date        text,                              -- YYYY-MM-DD
  content     text        not null,              -- natural language sentence
  embedding   vector(384),                       -- gte-small / all-MiniLM-L6-v2 dims
  metadata    jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- 3. IVFFlat index for fast cosine similarity search
create index if not exists forge_embeddings_embedding_idx
  on public.forge_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. Index on user_id for fast per-user queries
create index if not exists forge_embeddings_user_idx
  on public.forge_embeddings (user_id);

-- 5. Row Level Security — users see only their own embeddings
alter table public.forge_embeddings enable row level security;

create policy "Users can manage their own embeddings"
  on public.forge_embeddings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Match function used by forge-search Edge Function
create or replace function match_forge_embeddings (
  query_embedding  vector(384),
  match_user_id    uuid,
  match_count      int     default 8,
  type_filter      text    default null
)
returns table (
  id         text,
  type       text,
  date       text,
  content    text,
  metadata   jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    type,
    date,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from public.forge_embeddings
  where user_id = match_user_id
    and (type_filter is null or type = type_filter)
    and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;
