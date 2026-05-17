-- FitmentAI planned part source fields migration
-- Run this once in the Supabase SQL Editor.

alter table if exists public.planned_parts
add column if not exists source_url text,
add column if not exists source_type text not null default 'Retailer',
add column if not exists fitment_claim text;

alter table if exists public.planned_parts
drop constraint if exists planned_parts_source_type_check;

alter table if exists public.planned_parts
add constraint planned_parts_source_type_check
check (source_type in ('Manufacturer', 'Retailer', 'Marketplace', 'Shop', 'Forum'));
