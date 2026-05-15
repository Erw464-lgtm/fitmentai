alter table public.planned_parts
  add column if not exists fitment_score integer check (fitment_score between 0 and 100),
  add column if not exists fitment_status text,
  add column if not exists fitment_warning text,
  add column if not exists fitment_recommendation text,
  add column if not exists fitment_checked_at timestamptz;
