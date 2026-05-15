create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  display_name text,
  role text default 'user',
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  year text not null,
  make text not null,
  model text not null,
  trim text,
  nickname text,
  current_setup text,
  suspension_setup text,
  dream_setup text,
  parts_to_buy text,
  created_at timestamptz not null default now()
);

create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brand text,
  category text not null,
  type text not null,
  normalized_specs jsonb not null default '{}'::jsonb,
  compatibility_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.part_sources (
  id uuid primary key default gen_random_uuid(),
  part_id uuid references public.parts(id) on delete cascade,
  source_name text,
  source_type text,
  trust_level text,
  url text,
  price_range text,
  created_at timestamptz not null default now()
);

create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  name text not null,
  status text default 'planning',
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.build_parts (
  id uuid primary key default gen_random_uuid(),
  build_id uuid references public.builds(id) on delete cascade,
  part_id uuid references public.parts(id) on delete set null,
  status text default 'planned',
  fitment_score integer check (fitment_score between 0 and 100),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.planned_parts (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  name text not null,
  category text not null default 'Performance',
  source text,
  price text,
  status text not null default 'planned' check (status in ('planned', 'installed')),
  fitment_score integer check (fitment_score between 0 and 100),
  fitment_status text,
  fitment_warning text,
  fitment_recommendation text,
  fitment_checked_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.fitment_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  part_id uuid references public.parts(id) on delete set null,
  request jsonb not null,
  score integer not null check (score between 0 and 100),
  status text not null,
  risk_level text,
  warnings text[] not null default '{}',
  recommendations text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.fitment_feedback (
  id uuid primary key default gen_random_uuid(),
  fitment_check_id uuid references public.fitment_checks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  outcome text not null,
  user_note text,
  proof_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text,
  needed_feature text,
  note text,
  source text default 'fitmentai-mvp',
  created_at timestamptz not null default now()
);

create index if not exists waitlist_email_idx on public.waitlist(email);
create index if not exists vehicles_user_id_idx on public.vehicles(user_id);
create index if not exists builds_user_id_idx on public.builds(user_id);
create index if not exists parts_category_idx on public.parts(category);
create index if not exists planned_parts_vehicle_id_idx on public.planned_parts(vehicle_id);
create index if not exists fitment_checks_user_id_idx on public.fitment_checks(user_id);
