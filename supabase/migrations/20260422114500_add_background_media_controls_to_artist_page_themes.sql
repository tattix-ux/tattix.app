alter table public.artist_page_themes
add column if not exists background_overlay_strength text not null default 'balanced'
  check (background_overlay_strength in ('light', 'balanced', 'strong', 'extra-strong')),
add column if not exists background_image_softness text not null default 'soft'
  check (background_image_softness in ('sharp', 'soft', 'softer')),
add column if not exists background_image_focus text not null default 'center'
  check (background_image_focus in ('center', 'top', 'left', 'right'));
