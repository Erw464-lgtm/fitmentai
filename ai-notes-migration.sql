-- FitmentAI saved AI notes migration
-- Run this once in the Supabase SQL Editor.

create table if not exists public.ai_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  title text not null,
  question text,
  answer text not null,
  mode text,
  confidence text,
  created_at timestamptz not null default now()
);

create index if not exists ai_notes_user_id_idx on public.ai_notes(user_id);
create index if not exists ai_notes_vehicle_id_idx on public.ai_notes(vehicle_id);
create index if not exists ai_notes_created_at_idx on public.ai_notes(created_at desc);

alter table if exists public.ai_notes enable row level security;

drop policy if exists "ai_notes_select_own" on public.ai_notes;
drop policy if exists "ai_notes_insert_own" on public.ai_notes;
drop policy if exists "ai_notes_delete_own" on public.ai_notes;

create policy "ai_notes_select_own"
on public.ai_notes
for select to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = ai_notes.user_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "ai_notes_insert_own"
on public.ai_notes
for insert to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = ai_notes.user_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "ai_notes_delete_own"
on public.ai_notes
for delete to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = ai_notes.user_id
      and profiles.auth_user_id = auth.uid()
  )
);
