-- Essor — Schemes table (Neon Postgres)
-- Apply: psql "$DATABASE_URL" -f scripts/schema-schemes.sql
-- Idempotent: safe to re-run. Does NOT touch user_profiles.

create extension if not exists pg_trgm;

create table if not exists public.schemes (
  id text primary key,
  name text not null,
  name_hi text not null,
  name_mr text not null,
  department text not null default '',
  level text not null default 'Central' check (level in ('Central', 'Maharashtra')),
  categories text[] not null default '{}',
  target_group text not null default '',
  is_women_focused boolean not null default false,
  primary_goal text not null default 'subsidy' check (primary_goal in ('credit', 'skills', 'subsidy', 'insurance')),
  max_benefit text not null default '',
  summary text not null default '',
  eligibility text[] not null default '{}',
  documents text[] not null default '{}',
  apply_steps text[] not null default '{}',
  official_portal text not null default '',
  youtube_tutorials jsonb not null default '[]',
  official_articles jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_schemes_categories on public.schemes using gin (categories);
create index if not exists idx_schemes_level on public.schemes (level);
create index if not exists idx_schemes_goal on public.schemes (primary_goal);
create index if not exists idx_schemes_women on public.schemes (is_women_focused);
create index if not exists idx_schemes_name_trgm on public.schemes using gin (name gin_trgm_ops);

-- updated_at trigger (shared function may already exist from schema.sql)
create or replace function public.handle_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_schemes_updated on public.schemes;
create trigger trg_schemes_updated before update on public.schemes for each row execute function public.handle_updated_at();

-- ── Trilingual content (Sarvam Mayura translations of the English source) ──
-- Names already had name_hi/name_mr; everything else gets _hi/_mr columns.
alter table public.schemes add column if not exists summary_hi text not null default '';
alter table public.schemes add column if not exists summary_mr text not null default '';
alter table public.schemes add column if not exists eligibility_hi text[] not null default '{}';
alter table public.schemes add column if not exists eligibility_mr text[] not null default '{}';
alter table public.schemes add column if not exists documents_hi text[] not null default '{}';
alter table public.schemes add column if not exists documents_mr text[] not null default '{}';
alter table public.schemes add column if not exists apply_steps_hi text[] not null default '{}';
alter table public.schemes add column if not exists apply_steps_mr text[] not null default '{}';
alter table public.schemes add column if not exists max_benefit_hi text not null default '';
alter table public.schemes add column if not exists max_benefit_mr text not null default '';
alter table public.schemes add column if not exists department_hi text not null default '';
alter table public.schemes add column if not exists department_mr text not null default '';
alter table public.schemes add column if not exists target_group_hi text not null default '';
alter table public.schemes add column if not exists target_group_mr text not null default '';
