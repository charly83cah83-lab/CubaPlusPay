-- CompraMundo core schema scaffold.
-- Apply only after reviewing against the existing Supabase project and migrations.
-- This file intentionally does not create balances, exchange rates, or payment-provider credentials.
create extension if not exists pgcrypto;

create table if not exists public.cm_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.cm_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  asset_code text not null check (asset_code in ('CMX','USD','CUP','EUR','USDT','USDC','BTC','ETH')),
  status text not null default 'pending' check (status in ('pending','active','frozen','closed')),
  created_at timestamptz not null default now(),
  unique(user_id, asset_code)
);
create table if not exists public.cm_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  store_code text not null check (store_code in ('temu','amazon','ebay','other')),
  external_order_id text,
  product_url text,
  currency_code text not null,
  amount numeric(20,8) not null check (amount > 0),
  status text not null default 'draft' check (status in ('draft','pending_payment','payment_confirmed','submitted','fulfilled','cancelled','refunded','failed')),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);
create table if not exists public.cm_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.cm_wallets(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  transaction_id uuid not null,
  entry_kind text not null check (entry_kind in ('credit','debit','hold','release','reversal','fee')),
  amount numeric(20,8) not null check (amount > 0),
  asset_code text not null check (asset_code in ('CMX','USD','CUP','EUR','USDT','USDC','BTC','ETH')),
  status text not null default 'pending' check (status in ('pending','posted','reversed','failed')),
  reference text not null,
  created_at timestamptz not null default now(),
  unique(transaction_id, wallet_id, entry_kind, reference)
);
create table if not exists public.cm_payment_events (
  id uuid primary key default gen_random_uuid(),
  provider_code text not null,
  provider_event_id text not null,
  order_id uuid references public.cm_orders(id) on delete restrict,
  event_type text not null,
  verified boolean not null default false,
  payload_digest text,
  received_at timestamptz not null default now(),
  unique(provider_code, provider_event_id)
);
create index if not exists cm_orders_user_created_idx on public.cm_orders(user_id, created_at desc);
create index if not exists cm_ledger_user_created_idx on public.cm_ledger_entries(user_id, created_at desc);
create index if not exists cm_payment_events_order_idx on public.cm_payment_events(order_id);

alter table public.cm_profiles enable row level security;
alter table public.cm_wallets enable row level security;
alter table public.cm_orders enable row level security;
alter table public.cm_ledger_entries enable row level security;
alter table public.cm_payment_events enable row level security;

drop policy if exists "cm profile owner read" on public.cm_profiles;
create policy "cm profile owner read" on public.cm_profiles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "cm profile owner update" on public.cm_profiles;
create policy "cm profile owner update" on public.cm_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "cm wallet owner read" on public.cm_wallets;
create policy "cm wallet owner read" on public.cm_wallets for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "cm order owner read" on public.cm_orders;
create policy "cm order owner read" on public.cm_orders for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "cm order owner create draft" on public.cm_orders;
create policy "cm order owner create draft" on public.cm_orders for insert to authenticated with check ((select auth.uid()) = user_id and status = 'draft');
drop policy if exists "cm ledger owner read" on public.cm_ledger_entries;
create policy "cm ledger owner read" on public.cm_ledger_entries for select to authenticated using ((select auth.uid()) = user_id);
-- No client-side INSERT/UPDATE/DELETE policies for ledger, wallets, payment events, or order state.
-- Trusted server-side functions must validate provider webhooks, idempotency, and double-entry conservation.
