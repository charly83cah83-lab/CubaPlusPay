-- NEXO ONE AI starter schema (apply only after confirming the target Supabase project).
-- This migration creates isolated tables and does not modify existing CubaPlusPay tables.
create table if not exists public.nexo_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  project_type text not null default 'business' check (project_type in ('business','app','finance','workflow','network')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.nexo_projects enable row level security;
create policy "Users can read own NEXO projects" on public.nexo_projects for select to authenticated using (auth.uid() = user_id);
create policy "Users can create own NEXO projects" on public.nexo_projects for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own NEXO projects" on public.nexo_projects for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own NEXO projects" on public.nexo_projects for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.nexo_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null,
  model text,
  input_units integer not null default 0 check (input_units >= 0),
  output_units integer not null default 0 check (output_units >= 0),
  estimated_cost_usd numeric(12,6) not null default 0 check (estimated_cost_usd >= 0),
  idempotency_key text,
  created_at timestamptz not null default now()
);
create unique index if not exists nexo_usage_idempotency_user_idx on public.nexo_usage_events(user_id,idempotency_key) where idempotency_key is not null;
alter table public.nexo_usage_events enable row level security;
create policy "Users can read own NEXO usage" on public.nexo_usage_events for select to authenticated using (auth.uid() = user_id);
-- Intentionally no client INSERT/UPDATE/DELETE policy: usage must be recorded by a trusted server function.
