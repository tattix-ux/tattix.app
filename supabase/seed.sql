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

insert into public.artist_style_options (artist_id, style_key, label, style_description, enabled, multiplier, is_custom, deleted)
values
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'fine-line', 'Fine line', null, true, 1.00, false, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'minimal', 'Minimal', null, false, 1.00, false, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'traditional', 'Traditional', null, false, 1.00, false, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'neo-traditional', 'Neo traditional', null, false, 1.00, false, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'blackwork', 'Blackwork', null, true, 1.12, false, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'realism', 'Realism', null, false, 1.35, false, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'micro-realism', 'Micro realism', null, false, 1.20, false, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'ornamental', 'Ornamental', null, true, 1.20, false, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'lettering', 'Lettering', null, false, 1.00, false, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'custom', 'Custom', null, false, 1.10, false, false),
  ('7d53df9f-4fd8-41af-ae82-187a0b81b420', 'etching', 'Etching', 'Fine textures and engraved-looking line detail.', true, 1.08, true, false)
on conflict (artist_id, style_key) do update
set
  label = excluded.label,
  style_description = excluded.style_description,
  enabled = excluded.enabled,
  multiplier = excluded.multiplier,
  is_custom = excluded.is_custom,
  deleted = excluded.deleted;

insert into public.artist_pricing_rules (
  artist_id,
  anchor_price,
  base_price,
  minimum_charge,
  minimum_session_price,
  calibration_examples,
  calibration_reference_slots,
  size_modifiers,
  size_base_ranges,
  placement_modifiers,
  detail_level_modifiers,
  color_mode_modifiers,
  addon_fees,
  size_time_ranges,
  placement_multipliers,
  intent_multipliers
)
values (
  '7d53df9f-4fd8-41af-ae82-187a0b81b420',
  2400,
  3200,
  1500,
  1500,
  '{"size":{"tiny":1200,"small":1800,"medium":2800,"large":5200},"detailLevel":{"simple":2200,"standard":2600,"detailed":3200},"placement":{"neck-front":3200,"neck-side":3200,"neck-back":3000,"ribs":3000,"fingers":2600,"forearm-outer":2400,"forearm-inner":2500,"wrist":2500,"sternum":2900,"ankle":2600},"colorMode":{"black-only":2300,"black-grey":2500,"full-color":3100}}'::jsonb,
  '[{"slotId":"size-tiny","axis":"size","key":"tiny","label":"Size · tiny","assetRef":null},{"slotId":"size-small","axis":"size","key":"small","label":"Size · small","assetRef":null},{"slotId":"size-medium","axis":"size","key":"medium","label":"Size · medium","assetRef":null},{"slotId":"size-large","axis":"size","key":"large","label":"Size · large","assetRef":null},{"slotId":"detail-simple","axis":"detailLevel","key":"simple","label":"Detail · simple","assetRef":null},{"slotId":"detail-standard","axis":"detailLevel","key":"standard","label":"Detail · standard","assetRef":null},{"slotId":"detail-detailed","axis":"detailLevel","key":"detailed","label":"Detail · detailed","assetRef":null},{"slotId":"color-black-only","axis":"colorMode","key":"black-only","label":"Color · black-only","assetRef":null},{"slotId":"color-black-grey","axis":"colorMode","key":"black-grey","label":"Color · black-grey","assetRef":null},{"slotId":"color-full-color","axis":"colorMode","key":"full-color","label":"Color · full-color","assetRef":null}]'::jsonb,
  '{"tiny":{"min":0.35,"max":0.6},"small":{"min":0.55,"max":0.85},"medium":{"min":0.95,"max":1.2},"large":{"min":1.8,"max":2.4}}'::jsonb,
  '{"tiny":{"min":1000,"max":1800},"small":{"min":1500,"max":2500},"medium":{"min":3000,"max":5000},"large":{"min":6000,"max":9000}}'::jsonb,
  '{"neck-front":{"min":1.3,"max":1.3},"neck-side":{"min":1.3,"max":1.3},"neck-back":{"min":1.25,"max":1.25},"ribs":{"min":1.25,"max":1.25},"fingers":{"min":1.15,"max":1.15},"forearm-outer":{"min":1.0,"max":1.0},"forearm-inner":{"min":1.05,"max":1.05},"wrist":{"min":1.05,"max":1.05},"sternum":{"min":1.2,"max":1.2},"ankle":{"min":1.1,"max":1.1}}'::jsonb,
  '{"simple":{"min":0.9,"max":1.0},"standard":{"min":1.0,"max":1.15},"detailed":{"min":1.15,"max":1.35}}'::jsonb,
  '{"black-only":{"min":0.95,"max":1.0},"black-grey":{"min":1.0,"max":1.1},"full-color":{"min":1.18,"max":1.35}}'::jsonb,
  '{"coverUp":{"min":500,"max":1500},"customDesign":{"min":250,"max":1000}}'::jsonb,
  '{"tiny":{"minHours":0.5,"maxHours":1},"small":{"minHours":1,"maxHours":2},"medium":{"minHours":2,"maxHours":4},"large":{"minHours":4,"maxHours":6}}'::jsonb,
  '{"neck-front":1.3,"neck-side":1.3,"neck-back":1.25,"ribs":1.25,"fingers":1.15,"forearm-outer":1.0,"forearm-inner":1.05,"wrist":1.05,"sternum":1.2,"ankle":1.1}'::jsonb,
  '{"custom-tattoo":1.0,"design-in-mind":1.0,"flash-design":0.95,"discounted-design":0.85,"not-sure":1.0}'::jsonb
)
on conflict (artist_id) do update
set
  anchor_price = excluded.anchor_price,
  base_price = excluded.base_price,
  minimum_charge = excluded.minimum_charge,
  minimum_session_price = excluded.minimum_session_price,
  calibration_examples = excluded.calibration_examples,
  calibration_reference_slots = excluded.calibration_reference_slots,
  size_modifiers = excluded.size_modifiers,
  size_base_ranges = excluded.size_base_ranges,
  placement_modifiers = excluded.placement_modifiers,
  detail_level_modifiers = excluded.detail_level_modifiers,
  color_mode_modifiers = excluded.color_mode_modifiers,
  addon_fees = excluded.addon_fees,
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
  background_overlay_strength,
  background_image_softness,
  background_image_focus,
  text_color,
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
  'balanced',
  'soft',
  'center',
  '#f2e8df',
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
  background_overlay_strength = excluded.background_overlay_strength,
  background_image_softness = excluded.background_image_softness,
  background_image_focus = excluded.background_image_focus,
  text_color = excluded.text_color,
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
  status,
  contacted,
  converted_to_sale,
  sold_at,
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
    'sold',
    false,
    true,
    '2026-04-09T11:00:00.000Z',
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
    'contacted',
    true,
    false,
    null,
    '2026-04-07T12:10:00.000Z'
  );
