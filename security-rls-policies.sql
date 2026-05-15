-- FitmentAI Supabase Row Level Security policies
-- Run this in Supabase SQL Editor after the base schema is already created.
-- These policies are for direct Supabase client access. The current Next.js API
-- routes also verify ownership server-side.

alter table if exists public.profiles enable row level security;
alter table if exists public.vehicles enable row level security;
alter table if exists public.planned_parts enable row level security;
alter table if exists public.waitlist enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "vehicles_select_own" on public.vehicles;
drop policy if exists "vehicles_insert_own" on public.vehicles;
drop policy if exists "vehicles_update_own" on public.vehicles;
drop policy if exists "vehicles_delete_own" on public.vehicles;
drop policy if exists "planned_parts_select_own_vehicle" on public.planned_parts;
drop policy if exists "planned_parts_insert_own_vehicle" on public.planned_parts;
drop policy if exists "planned_parts_update_own_vehicle" on public.planned_parts;
drop policy if exists "planned_parts_delete_own_vehicle" on public.planned_parts;
drop policy if exists "waitlist_insert_public" on public.waitlist;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth_user_id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

create policy "vehicles_select_own"
on public.vehicles
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = vehicles.user_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "vehicles_insert_own"
on public.vehicles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = vehicles.user_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "vehicles_update_own"
on public.vehicles
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = vehicles.user_id
      and profiles.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = vehicles.user_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "vehicles_delete_own"
on public.vehicles
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = vehicles.user_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "planned_parts_select_own_vehicle"
on public.planned_parts
for select
to authenticated
using (
  exists (
    select 1
    from public.vehicles
    join public.profiles on profiles.id = vehicles.user_id
    where vehicles.id = planned_parts.vehicle_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "planned_parts_insert_own_vehicle"
on public.planned_parts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.vehicles
    join public.profiles on profiles.id = vehicles.user_id
    where vehicles.id = planned_parts.vehicle_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "planned_parts_update_own_vehicle"
on public.planned_parts
for update
to authenticated
using (
  exists (
    select 1
    from public.vehicles
    join public.profiles on profiles.id = vehicles.user_id
    where vehicles.id = planned_parts.vehicle_id
      and profiles.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.vehicles
    join public.profiles on profiles.id = vehicles.user_id
    where vehicles.id = planned_parts.vehicle_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "planned_parts_delete_own_vehicle"
on public.planned_parts
for delete
to authenticated
using (
  exists (
    select 1
    from public.vehicles
    join public.profiles on profiles.id = vehicles.user_id
    where vehicles.id = planned_parts.vehicle_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "waitlist_insert_public"
on public.waitlist
for insert
to anon, authenticated
with check (true);
