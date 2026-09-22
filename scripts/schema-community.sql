-- Essor — Khata / Orders / Samuday tables + profile extensions (Neon)
-- Apply: psql "$DATABASE_URL" -f scripts/schema-community.sql
-- Idempotent: safe to re-run. Does NOT touch existing rows.

-- ── Voice Khata (PS 9: informal credit history) ──
create table if not exists public.khata_entries (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  person_name text not null,
  amount numeric not null check (amount > 0),
  kind text not null check (kind in ('udhaar', 'jama')),
  note text not null default '',
  created_at timestamptz default now()
);
create index if not exists idx_khata_device on public.khata_entries (device_id);
create index if not exists idx_khata_created on public.khata_entries (created_at desc);

-- ── Order threads (PS 8: one timeline per deal) ──
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  title text not null,
  detail text not null default '',
  amount numeric not null default 0,
  kind text not null default 'sale' check (kind in ('sale', 'purchase')),
  counterparty_name text not null default '',
  status text not null default 'open'
    check (status in ('open', 'confirmed', 'paid', 'delivered', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_orders_device on public.orders (device_id);
drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.handle_updated_at();

-- ── Samuday circle messages (PS 10: peer circles, district × category) ──
create table if not exists public.circle_messages (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  district text not null default '',
  category text not null default '',
  display_name text not null default '',
  body text not null,
  created_at timestamptz default now()
);
create index if not exists idx_circle_lookup on public.circle_messages (district, category, created_at desc);

-- ── Profile extensions: UPI id (PS 8 payments) + Guide flag (PS 10 mentors) ──
alter table public.user_profiles add column if not exists upi_vpa text;
alter table public.user_profiles add column if not exists is_guide boolean not null default false;
alter table public.user_profiles add column if not exists guide_years integer not null default 0;
