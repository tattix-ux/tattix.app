alter table public.artist_page_themes
  add column if not exists card_feel text not null default 'balanced',
  add column if not exists button_style text not null default 'filled',
  add column if not exists badge_style text not null default 'colored';

alter table public.artist_page_themes
  drop constraint if exists artist_page_themes_card_feel_check,
  add constraint artist_page_themes_card_feel_check
    check (card_feel in ('subtle', 'balanced', 'defined'));

alter table public.artist_page_themes
  drop constraint if exists artist_page_themes_button_style_check,
  add constraint artist_page_themes_button_style_check
    check (button_style in ('filled', 'soft', 'outline'));

alter table public.artist_page_themes
  drop constraint if exists artist_page_themes_badge_style_check,
  add constraint artist_page_themes_badge_style_check
    check (badge_style in ('subtle', 'colored'));
