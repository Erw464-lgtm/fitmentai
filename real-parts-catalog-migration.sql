-- FitmentAI real parts catalog foundation
-- Run this once in Supabase SQL Editor.
-- This keeps the MVP honest: catalog rows are source/research starting points,
-- not guaranteed live inventory or final fitment approvals.

alter table if exists public.parts
add column if not exists slug text,
add column if not exists vehicle_make text,
add column if not exists vehicle_model text,
add column if not exists year_start integer,
add column if not exists year_end integer,
add column if not exists trim_notes text,
add column if not exists fitment_confidence integer check (fitment_confidence between 0 and 100),
add column if not exists fitment_risk text default 'Medium',
add column if not exists install_difficulty text default 'Moderate',
add column if not exists estimated_price text,
add column if not exists required_verification text[] not null default '{}',
add column if not exists tags text[] not null default '{}',
add column if not exists image_tone text default 'from-[#173923] via-[#0b1810] to-[#4f3b11]';

alter table if exists public.part_sources
add column if not exists source_priority integer default 3,
add column if not exists inventory_status text default 'Research',
add column if not exists last_verified_at timestamptz,
add column if not exists source_notes text;

create unique index if not exists parts_slug_uidx on public.parts(slug) where slug is not null;
create unique index if not exists parts_slug_full_uidx on public.parts(slug);
create unique index if not exists part_sources_part_source_uidx on public.part_sources(part_id, source_name) where source_name is not null;
create unique index if not exists part_sources_part_source_full_uidx on public.part_sources(part_id, source_name);
create index if not exists parts_vehicle_lookup_idx on public.parts(vehicle_make, vehicle_model, year_start, year_end);
create index if not exists parts_tags_gin_idx on public.parts using gin(tags);

insert into public.parts (
  slug,
  title,
  brand,
  category,
  type,
  vehicle_make,
  vehicle_model,
  year_start,
  year_end,
  trim_notes,
  normalized_specs,
  compatibility_notes,
  fitment_confidence,
  fitment_risk,
  install_difficulty,
  estimated_price,
  required_verification,
  tags,
  image_tone
) values
(
  '2017-porsche-macan-turbo-fabspeed-high-flow-intake',
  'High-flow intake research candidate',
  'Fabspeed Motorsport',
  'Performance',
  'Intake',
  'Porsche',
  'Macan',
  2015,
  2018,
  'Best matched to Macan Turbo style performance research; confirm exact engine and emissions notes.',
  '{"engine":"3.6L twin-turbo V6","demo_vehicle":"2017 Porsche Macan Turbo","supporting_mods":["ECU readiness","heat shielding","MAF/sensor compatibility"]}'::jsonb,
  'Performance intake candidate for the Macan Turbo demo flow. Verify manufacturer listing, engine code, emissions legality, and install hardware before purchase.',
  82,
  'Medium',
  'Moderate',
  '$450-$900 research range',
  array['Exact engine/trim compatibility','Emissions legality','Sensor/MAF fitment','Heat shield and hardware included'],
  array['Porsche','Macan','Turbo','Performance','Intake'],
  'from-[#102a1a] via-[#07120c] to-[#5d4614]'
),
(
  '2017-porsche-macan-turbo-soul-performance-exhaust',
  'Valved exhaust research candidate',
  'Soul Performance Products',
  'Performance',
  'Exhaust',
  'Porsche',
  'Macan',
  2015,
  2018,
  'Confirm Turbo-specific fitment, valve control, emissions, and sound expectations.',
  '{"system":"cat-back or axle-back research","demo_vehicle":"2017 Porsche Macan Turbo","checks":["valve compatibility","exhaust tip alignment","drone risk"]}'::jsonb,
  'High-end exhaust research candidate. Verify exact product page, valve behavior, emissions rules, and install hardware.',
  84,
  'Medium',
  'Moderate',
  '$1,800-$3,500 research range',
  array['Valve compatibility','Emissions/sound legality','Tip alignment','Install hardware'],
  array['Porsche','Macan','Turbo','Performance','Exhaust'],
  'from-[#142d1c] via-[#0a180f] to-[#604817]'
),
(
  '2017-porsche-macan-turbo-aa-carbon-rear-spoiler',
  'Carbon rear spoiler research candidate',
  'AA Carbon',
  'Exterior',
  'Spoiler',
  'Porsche',
  'Macan',
  2015,
  2018,
  'Confirm hatch shape, mounting tape/hardware, finish, weave, and Turbo trim notes.',
  '{"material":"carbon fiber research","position":"rear hatch","checks":["hatch shape","mounting method","finish quality"]}'::jsonb,
  'Carbon exterior candidate. Needs photo proof and clear return terms because carbon aero fitment can vary.',
  70,
  'Medium-high',
  'Easy-moderate',
  '$350-$900 research range',
  array['Hatch/body shape','Mounting method','Weave and finish','Return policy'],
  array['Porsche','Macan','Exterior','Carbon','Spoiler'],
  'from-[#173923] via-[#0b1810] to-[#4f3b11]'
),
(
  '2017-porsche-macan-turbo-rennline-billet-interior',
  'Billet interior upgrade research candidate',
  'Rennline',
  'Interior',
  'Interior hardware',
  'Porsche',
  'Macan',
  2015,
  2018,
  'Good enthusiast brand fit for interior and hardware research. Confirm Macan-specific listing.',
  '{"material":"billet aluminum research","checks":["mounting points","trim compatibility","finish"]}'::jsonb,
  'Interior/hardware candidate with lower fitment risk than exterior aero, but still needs listing-level confirmation.',
  86,
  'Low-medium',
  'Easy',
  '$80-$450 research range',
  array['Exact Macan listing','Mounting points','Finish/color','Included hardware'],
  array['Porsche','Macan','Interior','Billet','Rennline'],
  'from-[#102118] via-[#07120c] to-[#4f3b11]'
),
(
  '2017-porsche-macan-turbo-suncoast-oem-accessory',
  'OEM accessory research candidate',
  'Suncoast Porsche Parts',
  'Exterior',
  'OEM accessory',
  'Porsche',
  'Macan',
  2015,
  2018,
  'Dealer/OEM-style source. Confirm genuine Porsche part number and exact model year range.',
  '{"source_style":"dealer/OEM research","checks":["part number","dealer availability","year range"]}'::jsonb,
  'Strong source for OEM accessories and dealer-supported parts. Best used to confirm part numbers and factory-style compatibility.',
  90,
  'Low-medium',
  'Varies',
  'Varies by accessory',
  array['Genuine part number','Dealer availability','Year range','Trim notes'],
  array['Porsche','Macan','OEM','Exterior','Accessory'],
  'from-[#0f2b1a] via-[#07120c] to-[#49370f]'
),
(
  '2017-porsche-macan-turbo-fcp-euro-maintenance-kit',
  'Maintenance kit research candidate',
  'FCP Euro',
  'Performance',
  'Maintenance / OE replacement',
  'Porsche',
  'Macan',
  2015,
  2018,
  'Best for OE replacement and maintenance research. Confirm engine, service interval, and included parts.',
  '{"source_style":"Euro maintenance catalog","checks":["engine fitment","included parts","service interval"]}'::jsonb,
  'Maintenance/OE candidate. Useful for making the build reliable before adding more aggressive performance parts.',
  88,
  'Low',
  'Easy-moderate',
  'Varies by kit',
  array['Engine fitment','Included parts','Service interval','Warranty/return terms'],
  array['Porsche','Macan','Maintenance','OE','Reliability'],
  'from-[#102a1a] via-[#07120c] to-[#3d3320]'
),
(
  '2017-porsche-macan-turbo-flat6-performance-package',
  'Porsche specialist performance package research candidate',
  'Flat 6 Motorsports',
  'Performance',
  'Curated performance package',
  'Porsche',
  'Macan',
  2015,
  2018,
  'Boutique Porsche specialist source. Confirm Macan support, supporting mods, tune requirements, and install complexity.',
  '{"source_style":"Porsche specialist","checks":["supporting mods","tune requirements","install complexity"]}'::jsonb,
  'Curated Porsche specialist research candidate. Good for comparing staged upgrade logic rather than buying a blind single part.',
  83,
  'Medium',
  'Moderate-hard',
  'Varies by package',
  array['Macan platform support','Supporting mods','Tune requirements','Install complexity'],
  array['Porsche','Macan','Performance','Specialist','Package'],
  'from-[#142d1c] via-[#07120c] to-[#5d4614]'
)
on conflict (slug) do update set
  title = excluded.title,
  brand = excluded.brand,
  category = excluded.category,
  type = excluded.type,
  vehicle_make = excluded.vehicle_make,
  vehicle_model = excluded.vehicle_model,
  year_start = excluded.year_start,
  year_end = excluded.year_end,
  trim_notes = excluded.trim_notes,
  normalized_specs = excluded.normalized_specs,
  compatibility_notes = excluded.compatibility_notes,
  fitment_confidence = excluded.fitment_confidence,
  fitment_risk = excluded.fitment_risk,
  install_difficulty = excluded.install_difficulty,
  estimated_price = excluded.estimated_price,
  required_verification = excluded.required_verification,
  tags = excluded.tags,
  image_tone = excluded.image_tone;

delete from public.part_sources
using public.parts
where part_sources.part_id = parts.id
  and parts.slug in (
    '2017-porsche-macan-turbo-fabspeed-high-flow-intake',
    '2017-porsche-macan-turbo-soul-performance-exhaust',
    '2017-porsche-macan-turbo-aa-carbon-rear-spoiler',
    '2017-porsche-macan-turbo-rennline-billet-interior',
    '2017-porsche-macan-turbo-suncoast-oem-accessory',
    '2017-porsche-macan-turbo-fcp-euro-maintenance-kit',
    '2017-porsche-macan-turbo-flat6-performance-package'
  );

insert into public.part_sources (
  part_id,
  source_name,
  source_type,
  trust_level,
  url,
  price_range,
  source_priority,
  inventory_status,
  source_notes,
  last_verified_at
)
select parts.id, source_name, source_type, trust_level, url, price_range, source_priority, inventory_status, source_notes, now()
from public.parts
join (
  values
  ('2017-porsche-macan-turbo-fabspeed-high-flow-intake', 'Fabspeed Motorsport', 'Manufacturer', 'High', 'https://www.google.com/search?q=site%3Afabspeed.com+2017+Porsche+Macan+Turbo+intake', '$450-$900 research range', 1, 'Research', 'Manufacturer search link; verify exact product page and emissions notes.'),
  ('2017-porsche-macan-turbo-fabspeed-high-flow-intake', 'ECS Tuning', 'Retailer', 'Medium', 'https://www.ecstuning.com/Search/SiteSearch/2017+Porsche+Macan+Turbo+intake', 'Varies', 2, 'Research', 'Broad Euro catalog backup source.'),
  ('2017-porsche-macan-turbo-soul-performance-exhaust', 'Soul Performance Products', 'Manufacturer', 'High', 'https://www.google.com/search?q=site%3Asoulpp.com+2017+Porsche+Macan+Turbo+exhaust', '$1,800-$3,500 research range', 1, 'Research', 'Manufacturer search link; verify valves, sound, and emissions.'),
  ('2017-porsche-macan-turbo-soul-performance-exhaust', 'Fabspeed Motorsport', 'Manufacturer', 'High', 'https://www.google.com/search?q=site%3Afabspeed.com+2017+Porsche+Macan+Turbo+exhaust', 'Varies', 2, 'Research', 'Good alternate Porsche performance source.'),
  ('2017-porsche-macan-turbo-aa-carbon-rear-spoiler', 'AA Carbon', 'Retailer', 'Medium', 'https://aacarbonparts.com/search?q=2017%20Porsche%20Macan%20rear%20spoiler', '$350-$900 research range', 1, 'Research', 'Carbon aero source; verify photos and return terms.'),
  ('2017-porsche-macan-turbo-aa-carbon-rear-spoiler', 'Suncoast Porsche Parts', 'Retailer', 'High', 'https://www.google.com/search?q=site%3Asuncoastparts.com+Porsche+Macan+rear+spoiler', 'Varies', 2, 'Research', 'Useful OEM/dealer comparison source.'),
  ('2017-porsche-macan-turbo-rennline-billet-interior', 'Rennline', 'Manufacturer', 'High', 'https://www.rennline.com/search?q=2017%20Porsche%20Macan%20interior', '$80-$450 research range', 1, 'Research', 'Strong Porsche enthusiast brand source.'),
  ('2017-porsche-macan-turbo-suncoast-oem-accessory', 'Suncoast Porsche Parts', 'Retailer', 'High', 'https://www.google.com/search?q=site%3Asuncoastparts.com+2017+Porsche+Macan+accessory', 'Varies', 1, 'Research', 'Dealer/OEM source for part number confirmation.'),
  ('2017-porsche-macan-turbo-fcp-euro-maintenance-kit', 'FCP Euro', 'Retailer', 'High', 'https://www.fcpeuro.com/products?keywords=2017%20Porsche%20Macan%20Turbo', 'Varies', 1, 'Research', 'Maintenance/OE source; verify exact kit contents.'),
  ('2017-porsche-macan-turbo-fcp-euro-maintenance-kit', 'Pelican Parts', 'Retailer', 'High', 'https://www.google.com/search?q=site%3Apelicanparts.com+2017+Porsche+Macan+Turbo+maintenance', 'Varies', 2, 'Research', 'Strong DIY/research backup source.'),
  ('2017-porsche-macan-turbo-flat6-performance-package', 'Flat 6 Motorsports', 'Shop', 'High', 'https://flat6motorsports.com/search?q=2017%20Porsche%20Macan%20Turbo', 'Varies', 1, 'Research', 'Porsche specialist source for staged upgrade logic.')
) as source_seed(slug, source_name, source_type, trust_level, url, price_range, source_priority, inventory_status, source_notes)
on source_seed.slug = parts.slug;
