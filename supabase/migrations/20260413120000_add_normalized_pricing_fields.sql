alter table public.artist_pricing_rules
add column if not exists base_price integer not null default 3200,
add column if not exists minimum_charge integer not null default 0,
add column if not exists size_modifiers jsonb not null default '{"tiny":{"min":0.35,"max":0.6},"small":{"min":0.55,"max":0.85},"medium":{"min":0.95,"max":1.2},"large":{"min":1.8,"max":2.4}}'::jsonb,
add column if not exists placement_modifiers jsonb not null default '{}'::jsonb,
add column if not exists detail_level_modifiers jsonb not null default '{"simple":{"min":0.9,"max":1.0},"standard":{"min":1.0,"max":1.15},"detailed":{"min":1.15,"max":1.35}}'::jsonb,
add column if not exists color_mode_modifiers jsonb not null default '{"black-only":{"min":0.95,"max":1.0},"black-grey":{"min":1.0,"max":1.1},"full-color":{"min":1.18,"max":1.35}}'::jsonb,
add column if not exists addon_fees jsonb not null default '{"coverUp":{"min":500,"max":1500},"customDesign":{"min":250,"max":1000}}'::jsonb;

update public.artist_pricing_rules
set
  minimum_charge = coalesce(nullif(minimum_charge, 0), minimum_session_price),
  base_price = coalesce(
    nullif(base_price, 0),
    ((coalesce((size_base_ranges -> 'medium' ->> 'min')::numeric, 3000) + coalesce((size_base_ranges -> 'medium' ->> 'max')::numeric, 5000)) / 2)::integer
  )
where true;
