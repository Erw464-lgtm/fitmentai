create table if not exists public.planned_parts (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  name text not null,
  category text not null default 'Performance',
  source text,
  price text,
  status text not null default 'planned' check (status in ('planned', 'installed')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists planned_parts_vehicle_id_idx on public.planned_parts(vehicle_id);
