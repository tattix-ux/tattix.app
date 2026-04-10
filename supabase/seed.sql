insert into public.artists (
  id,
  user_id,
  artist_name,
  slug,
  short_bio,
  welcome_headline,
  whatsapp_number,
  instagram_handle,
  currency,
  active,
  plan_type,
  access_status
)
values (
  '7d53df9f-4fd8-41af-ae82-187a0b81b420',
  null,
  'Ink Atelier Demo',
  'ink-atelier-demo',
  'Boutique tattoo studio focused on elegant blackwork, fine line storytelling, and ornamental pieces.',
  'Start your tattoo brief in under two minutes.',
  '+905550001122',
  '@inkatelier.demo',
  'TRY',
  true,
  'pro',
  'active'
)
on conflict (id) do update
set
  artist_name = excluded.artist_name,
  slug = excluded.slug,
  short_bio = excluded.short_bio,
  welcome_headline = excluded.welcome_headline,
  whatsapp_number = excluded.whatsapp_number,
  instagram_handle = excluded.instagram_handle,
  currency = excluded.currency,
  active = excluded.active,
  plan_type = excluded.plan_type,
  access_status = excluded.access_status;

insert into public.artist_funnel_settings (
  artist_id,
  intro_eyebrow,
  intro_title,
  intro_description,
  show_featured_designs,
  default_language
)
values (
  '7d53df9f-4fd8-41af-ae82-187a0b81b420',
  'Link-in-bio funnel',
  'Tell us the vibe, size, and placement. Tattix will estimate the range.',
  'Perfect for Instagram bio traffic. Collect warmer leads, surface flash designs, and move straight into WhatsApp with context.',
  true,
  'tr'
)
on conflict (artist_id) do update
set
  intro_eyebrow = excluded.intro_eyebrow,
  intro_title = excluded.intro_title,
  intro_description = excluded.intro_description,
  show_featured_designs = excluded.show_featured_designs,
  default_language = excluded.default_language;

insert into public.artist_style_options (artist_id, style_key, label, enabled, multiplier, is_custom)
values
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'fine-line', 'Fine line', true, 1.00, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'minimal', 'Minimal', false, 1.00, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'traditional', 'Traditional', false, 1.00, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'neo-traditional', 'Neo traditional', false, 1.00, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'blackwork', 'Blackwork', true, 1.12, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'realism', 'Realism', false, 1.35, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'micro-realism', 'Micro realism', false, 1.20, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'ornamental', 'Ornamental', true, 1.20, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'lettering', 'Lettering', false, 1.00, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'custom', 'Custom', false, 1.10, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'etching', 'Etching', true, 1.08, true)
on conflict (artist_id, style_key) do update
set
  label = excluded.label,
  enabled = excluded.enabled,
  multiplier = excluded.multiplier,
  is_custom = excluded.is_custom;

insert into public.artist_pricing_rules (
  artist_id,
  minimum_session_price,
  size_base_ranges,
  size_time_ranges,
  placement_multipliers,
  intent_multipliers
)
values (
  '7d53df9f-4fd8-41af-ae82-187a0b81b420',
  1500,
  '{"tiny":{"min":1000,"max":1800},"small":{"min":1500,"max":2500},"medium":{"min":3000,"max":5000},"large":{"min":6000,"max":9000}}'::jsonb,
  '{"tiny":{"minHours":0.5,"maxHours":1},"small":{"minHours":1,"maxHours":2},"medium":{"minHours":2,"maxHours":4},"large":{"minHours":4,"maxHours":6}}'::jsonb,
  '{"neck-front":1.3,"neck-side":1.3,"neck-back":1.25,"ribs":1.25,"fingers":1.15,"forearm-outer":1.0,"forearm-inner":1.05,"wrist":1.05,"sternum":1.2,"ankle":1.1}'::jsonb,
  '{"custom-tattoo":1.0,"design-in-mind":1.0,"flash-design":0.95,"discounted-design":0.85,"not-sure":1.0}'::jsonb
)
on conflict (artist_id) do update
set
  minimum_session_price = excluded.minimum_session_price,
  size_base_ranges = excluded.size_base_ranges,
  size_time_ranges = excluded.size_time_ranges,
  placement_multipliers = excluded.placement_multipliers,
  intent_multipliers = excluded.intent_multipliers;

insert into public.artist_page_themes (
  artist_id,
  preset_theme,
  background_type,
  background_color,
  gradient_start,
  gradient_end,
  background_image_url,
  primary_color,
  secondary_color,
  card_color,
  card_opacity,
  heading_font,
  body_font,
  font_pairing_preset,
  radius_style,
  theme_mode,
  custom_welcome_title,
  custom_intro_text,
  custom_cta_label,
  featured_section_label_1,
  featured_section_label_2
)
values (
  '7d53df9f-4fd8-41af-ae82-187a0b81b420',
  'luxury-serif',
  'gradient',
  '#120d11',
  '#241521',
  '#0b090c',
  null,
  '#d7b48a',
  '#32262e',
  '#171116',
  0.82,
  'editorial-serif',
  'clean-sans',
  'elegant-editorial',
  'large',
  'dark',
  'Ink Atelier Demo',
  'Share the placement, size, and style. We’ll return a polished estimate range before you message the studio.',
  'Start estimate',
  'Featured collections',
  'Artist-picked concepts worth claiming'
)
on conflict (artist_id) do update
set
  preset_theme = excluded.preset_theme,
  background_type = excluded.background_type,
  background_color = excluded.background_color,
  gradient_start = excluded.gradient_start,
  gradient_end = excluded.gradient_end,
  background_image_url = excluded.background_image_url,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  card_color = excluded.card_color,
  card_opacity = excluded.card_opacity,
  heading_font = excluded.heading_font,
  body_font = excluded.body_font,
  font_pairing_preset = excluded.font_pairing_preset,
  radius_style = excluded.radius_style,
  theme_mode = excluded.theme_mode,
  custom_welcome_title = excluded.custom_welcome_title,
  custom_intro_text = excluded.custom_intro_text,
  custom_cta_label = excluded.custom_cta_label,
  featured_section_label_1 = excluded.featured_section_label_1,
  featured_section_label_2 = excluded.featured_section_label_2;

delete from public.artist_featured_designs
where artist_id = '7d53df9f-4fd8-41af-ae82-187a0b81b420';

insert into public.artist_featured_designs (
  id,
  artist_id,
  category,
  title,
  short_description,
  image_url,
  image_path,
  price_note,
  reference_price_min,
  reference_price_max,
  active,
  sort_order
)
values
  ('0f74d4c5-1be4-4b8b-9d9b-2ce80b966612', '7d53df9f-4fd8-41af-ae82-187a0b81b420', 'flash-designs', 'Serpent Bloom', 'Delicate floral coil built for forearm or calf placement.', null, null, 'From 2800 TRY', 2800, 4200, true, 1),
  ('354cab5b-2f9d-4fcb-91e8-9e46015f1f17', '7d53df9f-4fd8-41af-ae82-187a0b81b420', 'flash-designs', 'Lunar Dagger', 'A dramatic blackwork concept ideal for thigh or ribs.', null, null, 'From 3500 TRY', 3500, 5200, true, 2),
  ('36fc38bc-72de-438f-a6f2-cfbe0f34ea3a', '7d53df9f-4fd8-41af-ae82-187a0b81b420', 'discounted-designs', 'Mini Ornamental Charm', 'Quick ornamental accent intended for wrist, ankle, or hand.', null, null, 'Quick slot', 1200, 1800, true, 3);

delete from public.client_submissions
where artist_id = '7d53df9f-4fd8-41af-ae82-187a0b81b420';

insert into public.client_submissions (
  id,
  artist_id,
  intent,
  body_area_group,
  body_area_detail,
  size_mode,
  approximate_size_cm,
  size_category,
  width_cm,
  height_cm,
  city,
  style,
  notes,
  estimated_min,
  estimated_max,
  contact_message,
  contacted,
  created_at
)
values
  (
    '2401c841-c997-46f8-94b7-901bca8c9cb4',
    '7d53df9f-4fd8-41af-ae82-187a0b81b420',
    'custom-tattoo',
    'arm',
    'forearm-outer',
    'quick',
    9,
    'medium',
    9,
    null,
    'İzmir',
    'fine-line',
    'Botanical flow with soft leaves and a hidden crescent moon.',
    3000,
    4500,
    'Hi! I want to discuss a tattoo.

Intent: Custom tattoo
Placement: Forearm outer
Size: Medium
Approximate size: 9 cm
City: İzmir
Style: Fine line
Notes: Botanical flow with soft leaves and a hidden crescent moon.
Estimated price shown: 3000 - 4500 TRY',
    false,
    '2026-04-08T18:30:00.000Z'
  ),
  (
    'a14dd624-b43a-4347-91f7-61d9db916d5a',
    '7d53df9f-4fd8-41af-ae82-187a0b81b420',
    'discounted-design',
    'leg',
    'ankle',
    'quick',
    6,
    'small',
    6,
    null,
    'İstanbul',
    'ornamental',
    'Looking for a small mirrored ankle motif.',
    1600,
    2450,
    'Hi! I want to discuss a tattoo.

Intent: Discounted designs
Placement: Ankle
Size: Small
Approximate size: 6 cm
City: İstanbul
Style: Ornamental
Notes: Looking for a small mirrored ankle motif.
Estimated price shown: 1600 - 2450 TRY',
    true,
    '2026-04-07T12:10:00.000Z'
  );
