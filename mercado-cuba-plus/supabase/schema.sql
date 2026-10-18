-- Mercado Cuba Plus: esquema inicial de producción (NO aplicado).
-- Aplicar solo en un proyecto Supabase independiente o expresamente autorizado.
-- No modifica ni integra Cuba Plus Pay.
create extension if not exists pgcrypto;

create table if not exists public.mcp_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.mcp_products (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 1 and 140),
 description text not null default '',
 category text not null default 'Otros',
 unit_label text not null default 'unidad',
 image_url text,
 price_usd numeric(12,2) not null default 0 check(price_usd>=0),
 price_cup numeric(14,2) not null default 0 check(price_cup>=0),
 stock_status text not null default 'available' check(stock_status in ('available','low_stock','out_of_stock','confirm')),
 active boolean not null default true,
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
create table if not exists public.mcp_store_settings (
 id boolean primary key default true check(id),
 store_name text not null default 'MERCADO CUBA PLUS',
 commission_rate numeric(5,2) not null default 5 check(commission_rate between 0 and 25),
 commission_payer text not null default 'customer' check(commission_payer in ('customer','seller')),
 currency_enabled text[] not null default array['USD','CUP'],
 whatsapp_number text not null default '',
 phone_number text not null default '',
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
create table if not exists public.mcp_orders (
 id uuid primary key default gen_random_uuid(),
 public_reference text not null unique default ('MCP-'||upper(substr(encode(gen_random_bytes(8),'hex'),1,10))),
 customer_name text not null check(length(trim(customer_name)) between 1 and 100),
 customer_phone text not null check(length(trim(customer_phone)) between 3 and 35),
 delivery_zone text not null check(length(trim(delivery_zone)) between 1 and 100),
 delivery_address text not null check(length(trim(delivery_address)) between 1 and 240),
 customer_notes text not null default '',
 currency text not null check(currency in ('USD','CUP')),
 preferred_payment text not null check(preferred_payment in ('cash_usd','cash_cup','transfer_cup','coordinate')),
 status text not null default 'pending_review' check(status in ('pending_review','accepted','preparing','ready','delivering','completed','cancelled')),
 subtotal numeric(14,2) not null default 0 check(subtotal>=0),
 commission_rate numeric(5,2) not null default 0 check(commission_rate between 0 and 25),
 commission_payer text not null check(commission_payer in ('customer','seller')),
 commission_amount numeric(14,2) not null default 0 check(commission_amount>=0),
 delivery_fee numeric(14,2) not null default 0 check(delivery_fee>=0),
 total_amount numeric(14,2) not null default 0 check(total_amount>=0),
 payment_confirmed boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.mcp_order_items (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.mcp_orders(id) on delete cascade,
 product_id uuid references public.mcp_products(id) on delete set null,
 product_name_snapshot text not null,
 unit_snapshot text not null,
 quantity numeric(12,3) not null check(quantity>0 and quantity<=10000),
 unit_price numeric(14,2) not null check(unit_price>=0),
 line_total numeric(14,2) not null check(line_total>=0)
);
create table if not exists public.mcp_commission_ledger (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null unique references public.mcp_orders(id) on delete restrict,
 currency text not null check(currency in ('USD','CUP')),
 payer text not null check(payer in ('customer','seller')),
 rate numeric(5,2) not null check(rate between 0 and 25),
 amount numeric(14,2) not null check(amount>=0),
 state text not null default 'pending' check(state in ('pending','earned','reversed')),
 created_at timestamptz not null default now(),
 settled_at timestamptz
);

alter table public.mcp_admins enable row level security;
alter table public.mcp_products enable row level security;
alter table public.mcp_store_settings enable row level security;
alter table public.mcp_orders enable row level security;
alter table public.mcp_order_items enable row level security;
alter table public.mcp_commission_ledger enable row level security;

revoke all on public.mcp_admins from anon, authenticated;
grant select on public.mcp_admins to authenticated;
create policy "MCP admin reads own membership" on public.mcp_admins
 for select to authenticated using(user_id=(select auth.uid()));

grant select on public.mcp_products to anon, authenticated;
grant insert,update,delete on public.mcp_products to authenticated;
create policy "MCP public reads active products" on public.mcp_products
 for select to anon,authenticated using(active=true);
create policy "MCP admins manage products" on public.mcp_products
 for all to authenticated
 using(exists(select 1 from public.mcp_admins a where a.user_id=(select auth.uid())))
 with check(exists(select 1 from public.mcp_admins a where a.user_id=(select auth.uid())));

grant select on public.mcp_store_settings to anon,authenticated;
grant insert,update on public.mcp_store_settings to authenticated;
create policy "MCP public reads store settings" on public.mcp_store_settings
 for select to anon,authenticated using(true);
create policy "MCP admins manage settings" on public.mcp_store_settings
 for all to authenticated
 using(exists(select 1 from public.mcp_admins a where a.user_id=(select auth.uid())))
 with check(exists(select 1 from public.mcp_admins a where a.user_id=(select auth.uid())));

-- PII/order creation intentionally unavailable through direct anonymous table writes.
-- Trusted Edge Function must recalculate price, stock, commission and totals server-side.
grant select,update on public.mcp_orders to authenticated;
create policy "MCP admins read orders" on public.mcp_orders
 for select to authenticated
 using(exists(select 1 from public.mcp_admins a where a.user_id=(select auth.uid())));
create policy "MCP admins update orders" on public.mcp_orders
 for update to authenticated
 using(exists(select 1 from public.mcp_admins a where a.user_id=(select auth.uid())))
 with check(exists(select 1 from public.mcp_admins a where a.user_id=(select auth.uid())));

grant select on public.mcp_order_items to authenticated;
create policy "MCP admins read order items" on public.mcp_order_items
 for select to authenticated
 using(exists(select 1 from public.mcp_admins a where a.user_id=(select auth.uid())));
grant select on public.mcp_commission_ledger to authenticated;
create policy "MCP admins read commission ledger" on public.mcp_commission_ledger
 for select to authenticated
 using(exists(select 1 from public.mcp_admins a where a.user_id=(select auth.uid())));

-- No anonymous INSERT policy, and no browser-side payment confirmation.
-- Add a tested Edge Function before accepting real orders.
