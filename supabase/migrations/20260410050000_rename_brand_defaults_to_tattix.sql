alter table public.artist_funnel_settings
alter column intro_eyebrow set default 'Tattix intake';

update public.artist_funnel_settings
set
  intro_eyebrow = 'Tattix intake'
where intro_eyebrow = 'TatBot intake';

update public.artist_funnel_settings
set
  intro_title = replace(intro_title, 'TatBot', 'Tattix')
where intro_title like '%TatBot%';
