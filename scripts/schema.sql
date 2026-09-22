-- Essor — Neon Postgres schema (primary storage)
-- Apply: psql "$DATABASE_URL" -f scripts/schema.sql
-- Or: node scripts/apply-schema.js
-- Neon pooler URL includes ?sslmode=require&channel_binding=require

-- pgcrypto for gen_random_uuid() (Neon supports it)
create extension if not exists "pgcrypto";

-- Essor v0.0.1 — Fresh Schema (drop old if exists)
drop table if exists public.user_profiles cascade;

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  device_id text unique not null,
  role text not null check (role in ('seller','buyer')),
  preferred_language text not null check (preferred_language in ('english','hindi','marathi')),
  full_name text not null,
  location_name text not null,
  district text, state text not null default 'Maharashtra', pincode text,
  latitude double precision, longitude double precision,
  business_stage text check (business_stage in ('have_business','want_to_start')),
  business_name text, category text, what_you_sell text[], business_idea text,
  primary_goal text check (primary_goal in ('credit','customers','skills')),
  is_woman_entrepreneur boolean not null default false,
  phone text, buyer_preferences text[],
  profile_picture text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- Neon is direct Postgres: no RLS needed for server-side pool access.
-- (App reads/writes via /api/profile using DATABASE_URL, not anon keys.)
-- Keep RLS OFF so the pooler role has full access. If you enable RLS later,
-- add a permissive policy or use a dedicated app role.

create index if not exists idx_profiles_device on public.user_profiles(device_id);
create index if not exists idx_profiles_role on public.user_profiles(role);
create index if not exists idx_profiles_district on public.user_profiles(district);
create index if not exists idx_profiles_category on public.user_profiles(category);

-- updated_at trigger
create or replace function public.handle_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_profiles_updated on public.user_profiles;
create trigger trg_profiles_updated before update on public.user_profiles for each row execute function public.handle_updated_at();
